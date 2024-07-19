import { TelegramError } from "telegraf";
import { Entity } from "../lib/types";
import { At } from "./at";
import { Context } from "./context";
import { Coupon } from "./coupon";
import { UserModelUsages } from "./modelUsage";
import { PurchasedProduct } from "./product";

export type UsageStats = {
  modelUsages?: UserModelUsages;
};

export type UserSettings = {
  historySize?: number;
  temperature?: number;
  isDebugMode?: boolean;
};

export type InactivityRecord = {
  reason: string;
  error?: TelegramError;
};

type UserStatus = {
  isActive: boolean;
  updatedAt: At;
  inactivityRecord?: InactivityRecord;
};

export type User = Entity & {
  telegramId: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  phoneNumber?: string;
  context?: Context;
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
  status?: UserStatus;
}
