import { Entity } from "../lib/types";
import { At } from "./at";
import { Context } from "./context";
import { UserModelUsages } from "./modelUsage";
import { Product, PurchasedProduct } from "./product";

export type UserEvent = {
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
  events?: UserEvent[];
  products?: PurchasedProduct[];
  waitingForGptAnswer?: boolean;
  waitingForGptImageGeneration?: boolean;
  usageStats?: UsageStats;
  settings?: UserSettings;
  source?: string;
  isTester?: boolean;
}
