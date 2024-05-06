import { BroadcastRequest } from "../entities/broadcastRequest";
import { isEmpty } from "../lib/common";
import { Unsaved } from "../lib/types";
import { storeBroadcastRequest } from "../storage/broadcastRequestStorage";

type BroadcastPayload = Unsaved<BroadcastRequest> & {
  apiKey: string;
};

const config = {
  apiKey: process.env.API_KEY
};

export async function broadcastHook(payload: BroadcastPayload) {
  if (!config.apiKey) {
    throw new Error("API key is not configured.");
  }

  const { apiKey, ...request} = payload;

  if (!apiKey) {
    throw new Error("Empty `apiKey`. A string is expected.");
  }

  if (apiKey !== config.apiKey) {
    throw new Error("Invalid `apiKey`.");
  }

  if (!payload.resumeRequestId && isEmpty(payload.messages)) {
    throw new Error("Either `resumeRequestId` or not empty `messages` array are expected.");
  }

  await storeBroadcastRequest(request);
}
