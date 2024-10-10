import { EnWord } from "../lib/translate";

export type GptokensCode = "gptokens";

export type PureTextModelCode = "gpt3" | "gpt4" | "gpt-default" | "o1";
export type TextModelCode = PureTextModelCode | GptokensCode;

export type PureImageModelCode = "dalle3";
export type ImageModelCode = PureImageModelCode | GptokensCode;

export type PureModelCode = PureTextModelCode | PureImageModelCode;
export type ModelCode = TextModelCode | ImageModelCode;

export type TextModel =
  "gpt-3.5-turbo"
  | "gpt-4o"
  | "gpt-4o-mini"
  | "o1-preview"
  | "o1-mini";

export type ImageModel = "dall-e-3";

export type Model = TextModel | ImageModel;

export type ImageQuality = "standard" | "hd";
export type ImageSize = "1024x1024" | "1024x1792" | "1792x1024";
export type ImageStyle = "vivid" | "natural";
export type ImageResponseFormat = "url";

export type ImageSettings = {
  size: ImageSize;
  quality?: ImageQuality;
  style?: ImageStyle;
};

export const defaultImageSize: ImageSize = "1024x1024";

export const textModelMap: Record<PureTextModelCode, TextModel> = {
  "gpt-default": "gpt-4o-mini",
  "gpt3": "gpt-3.5-turbo",
  "gpt4": "gpt-4o",
  "o1": "o1-mini"
};

export const imageModelMap: Record<PureImageModelCode, ImageModel> = {
  "dalle3": "dall-e-3"
};

export const modelWordMap: Record<ModelCode, EnWord> = {
  "gpt-default": "request",
  "gpt3": "request",
  "gpt4": "request",
  "o1": "request",
  "dalle3": "image",
  "gptokens": "gptoken"
};

export const modelNameMap: Record<PureModelCode, string> = {
  "gpt-default": "GPT-4o mini",
  "gpt3": "GPT-3.5",
  "gpt4": "GPT-4o",
  "o1": "o1",
  "dalle3": "DALL-E 3"
};
