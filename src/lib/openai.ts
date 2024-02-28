export type GptModel = "gpt-3.5-turbo" | "gpt-4" | "gpt-4-1106-preview";

export type ImageModel = "dall-e-2" | "dall-e-3";
export type ImageQuality = "hd";
export type ImageSize = "256x256" | "512x512" | "1024x1024" | "1024x1792" | "1792x1024";
export type ImageResponseFormat = "url" | "b64_json";

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
