export type GptModel = "gpt-3.5-turbo-0125" | "gpt-4-0125-preview";

export type ImageModel = "dall-e-3";
export type ImageQuality = "hd";
export type ImageSize = "1024x1024" | "1024x1792" | "1792x1024";
export type ImageResponseFormat = "url" | "b64_json";

export type Model = GptModel | ImageModel;

export const defaultGptModel: GptModel = "gpt-3.5-turbo-0125";
export const defaultImageModel: ImageModel = "dall-e-3";
export const defaultImageSize: ImageSize = "1024x1024";
