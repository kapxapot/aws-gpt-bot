import { GptModelCode, ImageModelCode, ImageQuality, ImageSize } from "../entities/model";
import { getGptModelByCode, getImageModelByCode } from "./modelService";
import { getGptModelPrices, getImageModelPrice } from "./priceService";

export function getGptModelUsagePoints(modelCode: GptModelCode): number {
  const model = getGptModelByCode(modelCode);

  switch (modelCode) {
    case "gpt3":
    case "gpt4":
      return 1;

    case "gptokens":
      return getGptModelPrices(model).avgPrice;
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
