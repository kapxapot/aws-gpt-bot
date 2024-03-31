import { GptModel, ImageModel, Model } from "../entities/model";

export function isGptModel(model: Model): model is GptModel {
  return model === "gpt-3.5-turbo-0125" || model === "gpt-4-0125-preview";
}

export function isImageModel(model: Model): model is ImageModel {
  return model === "dall-e-3";
}

export const gptokenGptModel: GptModel = "gpt-4-0125-preview";
export const gptokenImageModel: ImageModel = "dall-e-3";
