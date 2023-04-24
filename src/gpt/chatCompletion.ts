import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import { Completion, CompletionError, Message, isCompletion } from "../entities/message";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export async function chatCompletion(
  userMessage: string,
  prompt: string | null,
  latestMessages: Message[] | null
): Promise<Completion | CompletionError> {
  const messages: ChatCompletionRequestMessage[] = [];

  if (prompt) {
    messages.push({
      role: "system",
      content: prompt
    });
  }

  if (latestMessages) {
    latestMessages.forEach(message => {
      messages.push({
        role: "user",
        content: message.request
      });

      if (isCompletion(message.response) && message.response.reply) {
        messages.push({
          role: "assistant",
          content: message.response.reply
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
        model: "gpt-3.5-turbo",
        messages: messages,
        temperature: 0.6
      },
      {
        timeout: parseInt(process.env.GPT_TIMEOUT!) * 1000,
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
  } catch (error: any) {
    if (error.response) {
      console.error(error.response.status, error.response.data);

      return {
        error: `Ошибка GPT: ${error.response.data.error.message}`
      };
    } else {
      const errorMessage = `Ошибка запроса к GPT: ${error.message}`;
      console.error(errorMessage);

      return {
        error: errorMessage
      };
    }
  }
}
