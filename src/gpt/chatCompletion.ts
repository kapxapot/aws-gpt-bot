import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default async function chatCompletion(userMessage: string, prompt: string = "") {
  const messages: ChatCompletionRequestMessage[] = [];

  if (prompt) {
    messages.push({
      role: "system",
      content: prompt
    });
  }

  messages.push({
    role: "user",
    content: userMessage
  });

  try {
    const completion = await openai.createChatCompletion(
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

    return completion.data.choices[0].message?.content;
  } catch (error: any) {
    if (error.response) {
      console.error(error.response.status, error.response.data);

      return `Ошибка GPT: ${error.response.data.error.message}`;
    } else {
      const errorMessage = `Ошибка запроса к GPT: ${error.message}`;
      console.error(errorMessage);

      return errorMessage;
    }
  }
}
