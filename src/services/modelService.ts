import { TextModel, TextModelCode, ImageModel, ImageModelCode, ModelCode, PureTextModelCode, PureImageModelCode, defaultTextModelCode, defaultImageModelCode, textModelMap, imageModelMap, modelWordMap, PureModelCode, modelNameMap } from "../entities/model";
import { symbols } from "../lib/constants";

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

export const getModelName = (modelCode: PureModelCode) => modelNameMap[modelCode];

export function getModelSymbol(modelCode: ModelCode): string | null {
  return (modelCode === "gptokens")
    ? symbols.gptoken
    : null;
}

export function formatModelSuffix(modelCode: ModelCode): string | null {
  switch (modelCode) {
    case "gpt3":
    case "gpt4":
    case "dalle3":
      return `к <b>${getModelName(modelCode)}</b>`;
  }

  return null;
}
