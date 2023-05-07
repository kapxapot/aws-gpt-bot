import { At, Timestamps } from "./at";
import { Context } from "./context";

export interface UserEvent {
  type: "purchase"
  details: any;
  at: At;
}

export interface UserSettings {
  historySize?: number;
  temperature?: number;
}

export interface User extends Timestamps {
  id: string;
  telegramId: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  context?: Context;
  events?: UserEvent[];
  settings?: UserSettings;
}
