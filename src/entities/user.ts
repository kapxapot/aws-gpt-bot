import { Entity } from "../lib/types";
import { At } from "./at";
import { Context } from "./context";
import { Product } from "./product";

export type UserEvent = {
  type: "purchase";
  details: Product;
  at: At;
};

export type UsageStats = {
  messageCount: number;
  startOfDay: number;
  lastMessageAt?: At;
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
  context?: Context;
  events?: UserEvent[];
  waitingForGptAnswer?: boolean;
  usageStats?: UsageStats;
  settings?: UserSettings;
  source?: string;
  isTester?: boolean;
}
