import { defaultImageModelCode, defaultTextModelCode } from "../entities/model";
import { ImageModelContext, TextModelContext } from "../entities/modelContext";
import { User } from "../entities/user";
import { getDefaultImageSettings } from "./imageService";
import { getImageModelByCode, getTextModelByCode, purifyImageModelCode, purifyTextModelCode } from "./modelService";
import { getImageModelUsagePoints } from "./modelUsageService";
import { getAvailableImageModel, getAvailableTextModel } from "./productService";
import { getLastUsedAt } from "./usageStatsService";
import { getUserActiveProduct } from "./userService";

export function getTextModelContext(user: User): TextModelContext {
  const product = getUserActiveProduct(user);

  const productModelCode = product
    ? getAvailableTextModel(product)
    : null;

  const usingProduct = !!product && !!productModelCode;

  const modelCode = productModelCode ?? defaultTextModelCode;
  const pureModelCode = purifyTextModelCode(modelCode);
  const model = getTextModelByCode(modelCode);

  const lastUsedAt = getLastUsedAt(user.usageStats, pureModelCode);

  return {
    product: usingProduct ? product : null,
    modelCode,
    pureModelCode,
    model,
    lastUsedAt
  };
}

export function getImageModelContext(user: User): ImageModelContext {
  const product = getUserActiveProduct(user);

  const productModelCode = product
    ? getAvailableImageModel(product)
    : null;

  const usingProduct = !!product && !!productModelCode;

  const modelCode = productModelCode ?? defaultImageModelCode;
  const pureModelCode = purifyImageModelCode(modelCode);
  const model = getImageModelByCode(modelCode);

  const lastUsedAt = getLastUsedAt(user.usageStats, pureModelCode);

  const imageSettings = getDefaultImageSettings();
  const usagePoints = getImageModelUsagePoints(modelCode, imageSettings);

  return {
    product: usingProduct ? product : null,
    modelCode,
    pureModelCode,
    model,
    lastUsedAt,
    imageSettings,
    usagePoints
  };
}
