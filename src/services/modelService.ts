import { TextModel, TextModelCode, ImageModel, ImageModelCode, ModelCode, PureTextModelCode, PureImageModelCode, defaultTextModelCode, defaultImageModelCode, textModelMap, imageModelMap, modelWordMap } from "../entities/model";

export function isTextModelCode(code: ModelCode): code is TextModelCode {
  return code === "gpt3" || code === "gpt4" || code === "gptokens";
}

export function isImageModelCode(code: ModelCode): code is ImageModelCode {
  return code === "dalle3" || code === "gptokens";
}

export function purifyTextModelCode(code: TextModelCode): PureTextModelCode {
  return code === "gptokens" ? "gpt4" : code;
}

export function purifyImageModelCode(code: ImageModelCode): PureImageModelCode {
  return code === "gptokens" ? "dalle3" : code;
}

export function getTextModelByCode(code: TextModelCode): TextModel {
  return textModelMap[purifyTextModelCode(code)];
}

export function getImageModelByCode(code: ImageModelCode): ImageModel {
  return imageModelMap[purifyImageModelCode(code)];
}

export function getDefaultTextModel(): TextModel {
  return getTextModelByCode(defaultTextModelCode);
}

export function getDefaultImageModel(): ImageModel {
  return getImageModelByCode(defaultImageModelCode);
}

export const getModelWord = (modelCode: ModelCode) => modelWordMap[modelCode];
