import { Entity } from "../lib/types";
import { At } from "./at";
import { Context } from "./context";
import { Interval } from "./interval";
import { Model } from "./model";
import { Product } from "./product";

export type UserEvent = {
  type: "purchase";
  details: Product;
  at: At;
};

type IntervalUsage = {
  startedAt: At;
  count: number;
}

export type ModelUsage = {
  lastUsedAt: At;
  intervalUsages: Partial<Record<Interval, IntervalUsage>>;
}

export type UsageStats = {
  /** @deprecated */
  startOfDay?: number;
  /** @deprecated */
  messageCount?: number;
  /** @deprecated */
  lastMessageAt?: At;
  modelUsages?: Partial<Record<Model, ModelUsage>>;
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
  waitingForGptAnswer?: boolean;
  waitingForGptImageGeneration?: boolean;
  usageStats?: UsageStats;
  settings?: UserSettings;
  source?: string;
  isTester?: boolean;
}
