import { Message } from "./message";

export interface User {
  id: string;
  telegramId: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  latestMessages?: Message[];
  prompt?: Message;
  createdAt: number;
  updatedAt: number;
}
