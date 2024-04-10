import { TextModelCode, ImageModelCode, ImageQuality, ImageSize } from "../entities/model";
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

export function getImageModelUsagePoints(modelCode: ImageModelCode, size: ImageSize, quality?: ImageQuality): number {
  const model = getImageModelByCode(modelCode);

  switch (modelCode) {
    case "dalle3":
    case "gptokens":
      return getImageModelPrice(model, size, quality).price;
  }
}
