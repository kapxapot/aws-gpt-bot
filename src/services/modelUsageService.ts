import { TextModelCode, ImageModelCode, ImageSettings } from "../entities/model";
import { getTextModelByCode, getImageModelByCode } from "./modelService";
import { getTextModelPrices, getImageModelPrice } from "./priceService";

export function getTextModelUsagePoints(modelCode: TextModelCode): number {
  const model = getTextModelByCode(modelCode);

  switch (modelCode) {
    case "gpt3":
    case "gpt4":
      return 1;

    case "gptokens":
      return getTextModelPrices(model).avgPrice;
  }
}

export function getImageModelUsagePoints(modelCode: ImageModelCode, imageSettings: ImageSettings): number {
  const model = getImageModelByCode(modelCode);

  switch (modelCode) {
    case "dalle3":
      return 1;

    case "gptokens":
      return getImageModelPrice(model, imageSettings).price;
  }
}
