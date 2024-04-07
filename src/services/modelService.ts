import { GptModel, GptModelCode, ImageModel, ImageModelCode, ModelCode, PureGptModelCode, PureImageModelCode, defaultGptModelCode, defaultImageModelCode, gptModelMap, imageModelMap } from "../entities/model";

export function isGptModelCode(code: ModelCode): code is GptModelCode {
  return code === "gpt3" || code === "gpt4" || code === "gptokens";
}

export function isImageModelCode(code: ModelCode): code is ImageModelCode {
  return code === "dalle3" || code === "gptokens";
}

export function purifyGptModelCode(code: GptModelCode): PureGptModelCode {
  return code === "gptokens" ? "gpt4" : code;
}

export function purifyImageModelCode(code: ImageModelCode): PureImageModelCode {
  return code === "gptokens" ? "dalle3" : code;
}

export function getGptModelByCode(code: GptModelCode): GptModel {
  return gptModelMap[purifyGptModelCode(code)];
}

export function getImageModelByCode(code: ImageModelCode): ImageModel {
  return imageModelMap[purifyImageModelCode(code)];
}

export function getDefaultGptModel(): GptModel {
  return getGptModelByCode(defaultGptModelCode);
}

export function getDefaultImageModel(): ImageModel {
  return getImageModelByCode(defaultImageModelCode);
}
