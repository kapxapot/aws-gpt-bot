import { ImageModelCode, ModelCode, TextModelCode } from "../entities/model";
import { ImageModelContext, ModelContext, TextModelContext } from "../entities/modelContext";
import { defaultPlan } from "../entities/plan";
import { isExpirableProduct, PurchasedProduct } from "../entities/product";
import { User } from "../entities/user";
import { getActiveConsumptionLimit, getConsumptionLimits } from "./consumptionService";
import { getDefaultImageSettings } from "./imageService";
import { getImageModelByCode, getTextModelByCode, isImageModelCode, isTextModelCode, purifyImageModelCode, purifyTextModelCode } from "./modelService";
import { getImageModelUsagePoints, getTextModelUsagePoints } from "./modelUsageService";
import { getPlanModels } from "./planService";
import { getProductAvailableModels } from "./productService";
import { getLastUsedAt } from "./usageStatsService";
import { getUserActiveProducts } from "./userService";

type ContextModel = {
  modelCode: ModelCode;
  product: PurchasedProduct | null;
}

export function getUsableModelContext<T extends ModelContext>(contexts: T[]): T | undefined {
  const expirable = contexts
    .filter(context => context.product && isExpirableProduct(context.product))
    .find(context => context.usable);

  return expirable ?? contexts.find(context => context.usable);
}

export function getTextModelContexts(user: User): TextModelContext[] {
  return getModels(user)
    .filter(model => isTextModelCode(model.modelCode))
    .map(
      model => buildTextModelContext(user, model.product, model.modelCode as TextModelCode)
    );
}

export function getImageModelContexts(user: User): ImageModelContext[] {
  return getModels(user)
    .filter(model => isImageModelCode(model.modelCode))
    .map(
      model => buildImageModelContext(user, model.product, model.modelCode as ImageModelCode)
    );
}

function getModels(user: User): ContextModel[] {
  const defaultPlanModels =
    getPlanModels(defaultPlan)
      .map(modelCode => ({ modelCode, product: null } as ContextModel));

  return getProductModels(user).concat(defaultPlanModels);
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
  const limits = getConsumptionLimits(user, product, modelCode, pureModelCode);

  const activeLimit = limits
    ? getActiveConsumptionLimit(limits)
    : null;

  const imageSettings = getDefaultImageSettings();
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

function getProductModels(user: User): ContextModel[] {
  const productModels = [];
  const products = getUserActiveProducts(user);

  for (const product of products) {
    const modelCodes = getProductAvailableModels(product);
    productModels.push(...modelCodes.map(modelCode => ({ modelCode, product })));
  }

  return productModels;
}
