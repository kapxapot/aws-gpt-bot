import OpenAI from "openai";

export const getOpenAiClient = () => new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

type OpenAiError = {
  error: {
    message: string;
  }
};

export function isOpenAiError(error: unknown): error is OpenAiError {
  return typeof error === "object"
    && error !== null
    && "error" in error
    && typeof error.error === "object"
    && error.error !== null
    && "message" in error.error
    && typeof error.error.message === "string";
}
