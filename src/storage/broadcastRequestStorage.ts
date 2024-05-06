import { getItem, putItem } from "../lib/database";
import { BroadcastRequest } from "../entities/broadcastRequest";
import { Unsaved } from "../lib/types";

const broadcastRequestsTable = process.env.BROADCAST_REQUESTS_TABLE!;

export const storeBroadcastRequest = async (request: Unsaved<BroadcastRequest>) =>
  await putItem<BroadcastRequest>(
    broadcastRequestsTable,
    request
  );

export const getBroadcastRequest = async (id: string): Promise<BroadcastRequest | null> =>
  await getItem<BroadcastRequest>(broadcastRequestsTable, id);
