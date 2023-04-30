import { At, Timestamps } from "./at";
import { IContext } from "./context";

export interface UserEvent {
  type: "purchase"
  details: any;
  at: At;
}

export interface User extends Timestamps {
  id: string;
  telegramId: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  context?: IContext;
  events?: UserEvent[]
}
