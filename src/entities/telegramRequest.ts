import { Timestamps } from "./at";

export interface TelegramRequest extends Timestamps {
  id: string;
  request: any;
}
