import { TextModelCode, ImageModelCode, ImageSettings } from "../entities/model";
import { getDefaultImageSettings } from "./imageService";
import { getTextModelByCode, getImageModelByCode } from "./modelService";
import { getTextModelPrices, getImageModelPrice } from "./priceService";

export type UsagePoints = {
  text: number;
  image: number;
};

export function getTextModelUsagePoints(modelCode: TextModelCode): number {
  const model = getTextModelByCode(modelCode);

  return modelCode === "gptokens"
    ? getTextModelPrices(model).avgPrice
    : 1;
}

export function getImageModelUsagePoints(
  modelCode: ImageModelCode,
  imageSettings?: ImageSettings
): number {
  const model = getImageModelByCode(modelCode);

  switch (modelCode) {
    case "dalle3":
      return 1;

    case "gptokens":
      imageSettings ??= getDefaultImageSettings();
      return getImageModelPrice(model, imageSettings).price;
  }
}

export const getGptokenUsagePoints = (imageSettings?: ImageSettings): UsagePoints => ({
  text: getTextModelUsagePoints("gptokens"),
  image: getImageModelUsagePoints("gptokens", imageSettings)
});
