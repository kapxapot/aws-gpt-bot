import { GptModel, ImageModel, ImageQuality, ImageSize } from "../entities/model";
import { imagePrices, textPrices } from "../entities/price";

export const getGptModelPrices = (model: GptModel) => textPrices[model];

export const getImageModelPrice = (model: ImageModel, size: ImageSize, quality?: ImageQuality) =>
  imagePrices[model].find(entry => entry.size === size && entry.quality === quality);
