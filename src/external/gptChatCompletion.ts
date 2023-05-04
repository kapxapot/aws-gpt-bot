import axios from "axios";
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import { Completion, Message } from "../entities/message";
import { Result, isSuccess } from "../lib/error";

const apiConfig = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});

const config = {
  apiTimeout: parseInt(process.env.GPT_TIMEOUT ?? "0") * 1000,
  model: "gpt-3.5-turbo",
  temperature: 0.6,
  promptMaxLength: 500,
  historyMessageMaxLength: 200
};

const openai = new OpenAIApi(apiConfig);

export async function gptChatCompletion(
  userMessage: string,
  prompt: string | null,
  latestMessages: Message[] | null
): Promise<Result<Completion>> {
  const messages: ChatCompletionRequestMessage[] = [];

  if (prompt) {
    messages.push({
      role: "system",
      content: prompt.substring(0, config.promptMaxLength)
    });
  }

  if (latestMessages) {
    latestMessages.forEach(message => {
      messages.push({
        role: "user",
        content: message.request.substring(0, config.historyMessageMaxLength)
      });

      if (isSuccess(message.response) && message.response.reply) {
        messages.push({
          role: "assistant",
          content: message.response.reply.substring(0, config.historyMessageMaxLength)
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
        model: config.model,
        temperature: config.temperature,
        messages: messages
      },
      {
        timeout: config.apiTimeout,
        timeoutErrorMessage: "Мы не дождались ответа. 😥"
      }
    );

    const completion = response.data;

    return {
      reply: completion.choices[0].message?.content ?? null,
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
