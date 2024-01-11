import { toArray, toText } from "../lib/common";
import { addBroadcast } from "../services/broadcastMessageService";

interface BroadcastPayload {
  apiKey: string;
  message: string | string[];
}

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

  const messages = toArray(payload.message)
    .map(m => m.trim())
    .filter(m => !!m);

  if (!messages.length) {
    throw new Error("Empty message (message). A not empty string or an array of strings is expected.");
  }

  const text = toText(...messages);

  await addBroadcast(text);
}
