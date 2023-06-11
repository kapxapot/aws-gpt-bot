import { At, Timestamps } from "./at";
import { Context } from "./context";
import { Product } from "./product";

export interface UserEvent {
  type: "purchase";
  details: Product;
  at: At;
}

export interface UsageStats {
  messageCount: number;
  startOfDay: number;
  lastMessageAt?: At;
}

export interface UserSettings {
  historySize?: number;
  temperature?: number;
  isDebugMode?: boolean;
}

export interface User extends Timestamps {
  id: string;
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
}
