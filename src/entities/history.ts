import { Message } from "./message";

export interface History {
  promptCode: string;
  messages: Message[];
}
