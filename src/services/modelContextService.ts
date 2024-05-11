import { ImageModelCode, ModelCode, TextModelCode, defaultImageModelCode, defaultTextModelCode } from "../entities/model";
import { ImageModelContext, TextModelContext } from "../entities/modelContext";
import { PurchasedProduct } from "../entities/product";
import { User } from "../entities/user";
import { getActiveConsumptionLimit, getConsumptionLimits } from "./consumptionService";
import { getDefaultImageSettings } from "./imageService";
import { getImageModelByCode, getTextModelByCode, isImageModelCode, isTextModelCode, purifyImageModelCode, purifyTextModelCode } from "./modelService";
import { getImageModelUsagePoints, getTextModelUsagePoints } from "./modelUsageService";
import { getProductAvailableModels } from "./productService";
import { getLastUsedAt } from "./usageStatsService";
import { getUserActiveProducts } from "./userService";

type ProductModel = {
  product: PurchasedProduct | null;
  modelCode: ModelCode;
}

export function getTextModelContexts(user: User): TextModelContext[] {
  const productModels = getProductModels(user)
    .filter(pm => isTextModelCode(pm.modelCode));

  productModels.push({ product: null, modelCode: defaultTextModelCode });

  return productModels.map(
    pm => buildTextModelContext(user, pm.product, pm.modelCode as TextModelCode)
  );
}

export function getImageModelContexts(user: User): ImageModelContext[] {
  const productModels = getProductModels(user)
    .filter(pm => isImageModelCode(pm.modelCode));

  productModels.push({ product: null, modelCode: defaultImageModelCode });

  return productModels.map(
    pm => buildImageModelContext(user, pm.product, pm.modelCode as ImageModelCode)
  );
}

function buildTextModelContext(
  user: User,
  product: PurchasedProduct | null,
  modelCode: TextModelCode
): TextModelContext {
  const pureModelCode = purifyTextModelCode(modelCode);
  const model = getTextModelByCode(modelCode);

  const lastUsedAt = getLastUsedAt(user.usageStats, pureModelCode);

  const limits = getConsumptionLimits(user, product, modelCode, pureModelCode);

  const activeLimit = limits
    ? getActiveConsumptionLimit(limits)
    : null;

  const usagePoints = getTextModelUsagePoints(modelCode);

  const usable = activeLimit !== null
    && activeLimit.remaining >= usagePoints;

  return {
    product,
    modelCode,
    pureModelCode,
    model,
    lastUsedAt,
    limits,
    activeLimit,
    usagePoints,
    usable
  };
}

function buildImageModelContext(
  user: User,
  product: PurchasedProduct | null,
  modelCode: ImageModelCode
): ImageModelContext {
  const pureModelCode = purifyImageModelCode(modelCode);
  const model = getImageModelByCode(modelCode);

  const lastUsedAt = getLastUsedAt(user.usageStats, pureModelCode);

  const imageSettings = getDefaultImageSettings();

  const limits = getConsumptionLimits(user, product, modelCode, pureModelCode);

  const activeLimit = limits
    ? getActiveConsumptionLimit(limits)
    : null;

  const usagePoints = getImageModelUsagePoints(modelCode, imageSettings);

  const usable = activeLimit !== null
    && activeLimit.remaining >= usagePoints;

  return {
    product,
    modelCode,
    pureModelCode,
    model,
    lastUsedAt,
    imageSettings,
    limits,
    activeLimit,
    usagePoints,
    usable
  };
}

function getProductModels(user: User): ProductModel[] {
  const productModels: ProductModel[] = [];
  const products = getUserActiveProducts(user);

  for (const product of products) {
    const modelCodes = getProductAvailableModels(product);
    productModels.push(...modelCodes.map(modelCode => ({ product, modelCode })));
  }

  return productModels;
}
