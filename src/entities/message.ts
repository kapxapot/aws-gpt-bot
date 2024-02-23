import { Result } from "../lib/error";
import { Entity } from "../lib/types";
import { At } from "./at";

type Usage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type Completion = {
  reply: string | null;
  usage: Usage | null;
  model?: string;
};

export type Message = Entity & {
  userId: string;
  request: string;
  response: Result<Completion>;
  requestedAt: At;
  respondedAt: At;
};
