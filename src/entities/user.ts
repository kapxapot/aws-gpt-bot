import { IContext } from "./context";

export interface User {
  id: string;
  telegramId: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  context?: IContext;
  createdAt: number;
  updatedAt: number;
}
