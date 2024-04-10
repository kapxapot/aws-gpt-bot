export type GptokensCode = "gptokens";

export type PureTextModelCode = "gpt3" | "gpt4";
export type TextModelCode = PureTextModelCode | GptokensCode;

export type PureImageModelCode = "dalle3";
export type ImageModelCode = PureImageModelCode | GptokensCode;

export type PureModelCode = PureTextModelCode | PureImageModelCode;
export type ModelCode = TextModelCode | ImageModelCode;

export type TextModel = "gpt-3.5-turbo" | "gpt-4-turbo";
export type ImageModel = "dall-e-3";

export type Model = TextModel | ImageModel;

export type ImageQuality = "hd";
export type ImageSize = "1024x1024" | "1024x1792" | "1792x1024";
export type ImageResponseFormat = "url" | "b64_json";

export const defaultTextModelCode: TextModelCode = "gpt3";
export const defaultImageModelCode: ImageModelCode = "dalle3";
export const defaultImageSize: ImageSize = "1024x1024";

export const textModelMap: Record<PureTextModelCode, TextModel> = {
  "gpt3": "gpt-3.5-turbo",
  "gpt4": "gpt-4-turbo"
};

export const imageModelMap: Record<PureImageModelCode, ImageModel> = {
  "dalle3": "dall-e-3"
};
