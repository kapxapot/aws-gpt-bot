import { TextModel, ImageModel, ImageQuality, ImageSize } from "../entities/model";
import { imagePrices, textPrices } from "../entities/price";

export const getTextModelPrices = (model: TextModel) => textPrices[model];

export const getImageModelPrice = (model: ImageModel, size: ImageSize, quality?: ImageQuality) => {
  const price = imagePrices[model].find(entry => entry.size === size && entry.quality === quality);

  if (!price) {
    throw new Error(`The price is not defined for image model ${model}, size ${size} and quality ${quality}.`);
  }

  return price;
}
