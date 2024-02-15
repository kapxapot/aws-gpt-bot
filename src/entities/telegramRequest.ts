import { Entity } from "../lib/types";

export type TelegramRequest = Entity & {
  request: unknown;
};
