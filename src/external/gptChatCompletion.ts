import axios from "axios";
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import { Completion } from "../entities/message";
import { Result, isSuccess } from "../lib/error";
import { User } from "../entities/user";
import { getCurrentContext } from "../services/userService";
import { getUserHistorySize, getUserTemperature } from "../services/userSettingsService";
import { settings } from "../lib/constants";
import { gptTimeout } from "../services/gptService";
import { getUserGptModel } from "../services/planService";

const apiConfig = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});

const config = {
  gptTimeout: gptTimeout * 1000,
  maxPromptLength: settings.maxPromptLength,
  maxHistoryMessageLength: settings.maxHistoryMessageLength
};

const openai = new OpenAIApi(apiConfig);

export async function gptChatCompletion(user: User, userMessage: string): Promise<Result<Completion>> {
  const messages: ChatCompletionRequestMessage[] = [];

  const historySize = getUserHistorySize(user);
  const { prompt, latestMessages } = getCurrentContext(user, historySize);

  if (prompt) {
    messages.push({
      role: "system",
      content: prompt.substring(0, config.maxPromptLength)
    });
  }

  if (latestMessages) {
    latestMessages.forEach(message => {
      messages.push({
        role: "user",
        content: message.request.substring(0, config.maxHistoryMessageLength)
      });

      if (isSuccess(message.response) && message.response.reply) {
        messages.push({
          role: "assistant",
          content: message.response.reply.substring(0, config.maxHistoryMessageLength)
        });
      }
    });
  }

  messages.push({
    role: "user",
    content: userMessage
  });

  try {
    const response = await openai.createChatCompletion(
      {
        model: getUserGptModel(user),
        temperature: getUserTemperature(user),
        messages: messages
      },
      {
        timeout: config.gptTimeout,
        timeoutErrorMessage: "Мы не дождались ответа. 😥"
      }
    );

    const completion = response.data;

    return {
      reply: completion.choices[0].message?.content ?? null,
      model: completion.model,
      usage: completion.usage
        ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens
        }
        : null
    };
  } catch (error) {
    console.error(error);

    if (axios.isAxiosError(error)) {
      const message = error.response?.data.error.message ?? error.message;

      return new Error(`Ошибка OpenAI API: ${message}`);
    }

    return new Error("Ошибка обращения к OpenAI API.");
  }
}
