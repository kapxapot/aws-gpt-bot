import { toSanitizedArray } from "../lib/common";
import { storeBroadcastRequest } from "../storage/broadcastRequestStorage";

type BroadcastPayload = {
  apiKey: string;
  message: string | string[];
  users?: string[];
  isTest?: boolean;
};

export async function broadcastHook(payload: BroadcastPayload) {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error("API key is not configured.");
  }

  if (!payload.apiKey) {
    throw new Error("Empty API key (apiKey).");
  }

  if (payload.apiKey !== apiKey) {
    throw new Error("Invalid API key.");
  }

  const messages = toSanitizedArray(payload.message);

  if (!messages.length) {
    throw new Error("Empty message (message). A not empty string or an array of strings is expected.");
  }

  await storeBroadcastRequest({
    messages,
    users: payload.users,
    isTest: payload.isTest
  });
}
