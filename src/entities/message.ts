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

export interface CompletionError {
  error: string;
}

export interface Message extends Timestamps {
  id: string;
  userId: string;
  request: string;
  response: Completion | CompletionError;
  requestedAt: At;
  respondedAt: At;
}

export function isCompletion(message: Completion | CompletionError): message is Completion {
  return "reply" in message;
}

export function isCompletionError(message: Completion | CompletionError): message is CompletionError {
  return "error" in message;
}
