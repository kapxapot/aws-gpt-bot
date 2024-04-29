import { defaultImageModelCode, defaultTextModelCode } from "../entities/model";
import { ImageModelContext, TextModelContext } from "../entities/modelContext";
import { User } from "../entities/user";
import { getActiveConsumptionLimit, getConsumptionLimits } from "./consumptionService";
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

  const validProduct = (product && productModelCode) ? product : null;

  const modelCode = productModelCode ?? defaultTextModelCode;
  const pureModelCode = purifyTextModelCode(modelCode);
  const model = getTextModelByCode(modelCode);

  const lastUsedAt = getLastUsedAt(user.usageStats, pureModelCode);

  const consumptionLimits = getConsumptionLimits(user, product, modelCode, pureModelCode);

  const activeConsumptionLimit = consumptionLimits
    ? getActiveConsumptionLimit(consumptionLimits)
    : null;

  return {
    product: validProduct,
    modelCode,
    pureModelCode,
    model,
    lastUsedAt,
    consumptionLimits,
    activeConsumptionLimit
  };
}

export function getImageModelContext(user: User): ImageModelContext {
  const product = getUserActiveProduct(user);

  const productModelCode = product
    ? getAvailableImageModel(product)
    : null;

  const validProduct = (product && productModelCode) ? product : null;

  const modelCode = productModelCode ?? defaultImageModelCode;
  const pureModelCode = purifyImageModelCode(modelCode);
  const model = getImageModelByCode(modelCode);

  const lastUsedAt = getLastUsedAt(user.usageStats, pureModelCode);

  const imageSettings = getDefaultImageSettings();
  const usagePoints = getImageModelUsagePoints(modelCode, imageSettings);

  const consumptionLimits = getConsumptionLimits(user, product, modelCode, pureModelCode);

  const activeConsumptionLimit = consumptionLimits
    ? getActiveConsumptionLimit(consumptionLimits)
    : null;

  return {
    product: validProduct,
    modelCode,
    pureModelCode,
    model,
    lastUsedAt,
    imageSettings,
    usagePoints,
    consumptionLimits,
    activeConsumptionLimit
  };
}
