import { ModelCode, PureModelCode } from "../entities/model";
import { defaultPlan } from "../entities/plan";
import { PurchasedProduct } from "../entities/product";
import { User } from "../entities/user";
import { getProductUsageReport } from "./productUsageService";
import { getUsageStatsReport } from "./usageStatsService";

export const getUsageReport = (
  user: User,
  modelCode: ModelCode,
  pureModelCode: PureModelCode,
  product: PurchasedProduct | null
) => product
  ? getProductUsageReport(user, product, modelCode)
  : getUsageStatsReport(user, defaultPlan, pureModelCode);
