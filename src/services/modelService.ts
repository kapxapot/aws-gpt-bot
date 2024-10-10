import { TextModel, TextModelCode, ImageModel, ImageModelCode, ModelCode, PureTextModelCode, PureImageModelCode, textModelMap, imageModelMap, modelWordMap, PureModelCode, modelNameMap } from "../entities/model";

export function isTextModelCode(code: ModelCode): code is TextModelCode {
  return code === "gpt3" ||
    code === "gpt4" ||
    code === "gpt-default" ||
    code === "gptokens";
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

export const getModelWord = (modelCode: ModelCode) => modelWordMap[modelCode];

export const getModelName = (modelCode: PureModelCode) => modelNameMap[modelCode];

export const gptDefaultModelName = getModelName("gpt-default");
export const gptPremiumModelName = getModelName("gpt4");

export function getModelSymbol(modelCode: ModelCode): string | null {
  return (modelCode === "gptokens")
    ? "🍥"
    : null;
}
