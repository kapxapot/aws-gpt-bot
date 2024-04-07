export type GptokensCode = "gptokens";

export type PureGptModelCode = "gpt3" | "gpt4";
export type GptModelCode = PureGptModelCode | GptokensCode;

export type PureImageModelCode = "dalle3";
export type ImageModelCode = PureImageModelCode | GptokensCode;

export type PureModelCode = PureGptModelCode | PureImageModelCode;
export type ModelCode = GptModelCode | ImageModelCode;

export type GptModel = "gpt-3.5-turbo-0125" | "gpt-4-0125-preview";
export type ImageModel = "dall-e-3";

export type Model = GptModel | ImageModel;

export type ImageQuality = "hd";
export type ImageSize = "1024x1024" | "1024x1792" | "1792x1024";
export type ImageResponseFormat = "url" | "b64_json";

export const defaultGptModelCode: GptModelCode = "gpt3";
export const defaultImageModelCode: ImageModelCode = "dalle3";
export const defaultImageSize: ImageSize = "1024x1024";

export const gptModelMap: Record<PureGptModelCode, GptModel> = {
  "gpt3": "gpt-3.5-turbo-0125",
  "gpt4": "gpt-4-0125-preview"
};

export const imageModelMap: Record<PureImageModelCode, ImageModel> = {
  "dalle3": "dall-e-3"
};
