import axios from "axios";
import OpenAI from "openai";
import { Completion } from "../entities/message";
import { Result, isSuccess } from "../lib/error";
import { User } from "../entities/user";
import { getCurrentContext } from "../services/userService";
import { getUserHistorySize, getUserTemperature } from "../services/userSettingsService";
import { settings } from "../lib/constants";
import { gptTimeout } from "../services/gptService";
import { getUserGptModel } from "../services/planService";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

const config = {
  gptTimeout: gptTimeout * 1000,
  maxPromptLength: settings.maxPromptLength,
  maxHistoryMessageLength: settings.maxHistoryMessageLength
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function gptChatCompletion(user: User, userMessage: string): Promise<Result<Completion>> {
  const messages: ChatCompletionMessageParam[] = [];

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
    const response = await openai.chat.completions.create(
      {
        model: getUserGptModel(user),
        temperature: getUserTemperature(user),
        messages: messages
      },
      {
        timeout: config.gptTimeout
      }
    );

    return {
      reply: response.choices[0].message?.content ?? null,
      model: response.model,
      usage: response.usage
        ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
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
