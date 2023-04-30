import { Result } from "../lib/error";
import { At, Timestamps } from "./at";

export interface Usage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface Completion {
  reply: string | null;
  usage: Usage | null;
}

export interface Message extends Timestamps {
  id: string;
  userId: string;
  request: string;
  response: Result<Completion>;
  requestedAt: At;
  respondedAt: At;
}
