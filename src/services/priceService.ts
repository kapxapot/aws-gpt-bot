import { TextModel, ImageModel, ImageSettings } from "../entities/model";
import { imagePrices, textPrices } from "../entities/price";
import { imageSettingsEqual } from "./imageService";

export const getTextModelPrices = (model: TextModel) => textPrices[model];

export const getImageModelPrice = (model: ImageModel, imageSettings: ImageSettings) => {
  const price = imagePrices[model].find(
    entry => imageSettingsEqual(entry.settings, imageSettings)
  );

  if (!price) {
    throw new Error(`The price is not defined for image model ${model} and settings ${JSON.stringify(imageSettings)}.`);
  }

  return price;
}
