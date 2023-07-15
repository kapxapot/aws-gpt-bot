import { broadcastMessage } from "../services/messageService";

interface BroadcastPayload {
  apiKey: string;
  message: string;
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

  const msg = payload.message?.trim();

  if (!msg) {
    throw new Error("Empty message (message).");
  }

  await broadcastMessage(payload.message);
}
