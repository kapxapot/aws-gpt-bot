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

export interface Message {
  id: string;
  userId: string;
  request: string;
  response: Completion | CompletionError;
  createdAt: number;
  updatedAt: number;
}

export function isCompletion(message: Completion | CompletionError): message is Completion {
  return "reply" in message;
}

export function isCompletionError(message: Completion | CompletionError): message is CompletionError {
  return "error" in message;
}
