import { Entity } from "../lib/types";
import { At } from "./at";
import { Context } from "./context";
import { Coupon } from "./coupon";
import { UserModelUsages } from "./modelUsage";
import { Product, PurchasedProduct } from "./product";

/** @deprecated Remove in >1 month after 0.2 release */
type UserEvent = {
  type: "purchase";
  details: Product;
  at: At;
};

export type UsageStats = {
  /** @deprecated Remove in 0.3.0 */
  startOfDay?: number;
  /** @deprecated Remove in 0.3.0 */
  messageCount?: number;
  /** @deprecated Remove in 0.3.0 */
  lastMessageAt?: At;
  modelUsages?: UserModelUsages;
};

export type UserSettings = {
  historySize?: number;
  temperature?: number;
  isDebugMode?: boolean;
};

export type User = Entity & {
  telegramId: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  phoneNumber?: string;
  context?: Context;
  /** @deprecated Remove in >1 month after 0.2 release */
  events?: UserEvent[];
  products?: PurchasedProduct[];
  coupons?: Coupon[];
  waitingForGptAnswer?: boolean;
  waitingForGptImageGeneration?: boolean;
  usageStats?: UsageStats;
  settings?: UserSettings;
  source?: string;
  isTester?: boolean;
  inviteeIds?: string[];
  invitedById?: string;
}
