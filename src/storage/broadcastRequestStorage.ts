import { putItem } from "../lib/database";
import { BroadcastRequest } from "../entities/broadcastRequest";
import { Unsaved } from "../lib/types";

const broadcastRequestsTable = process.env.BROADCAST_REQUESTS_TABLE!;

export const storeBroadcastRequest = async (request: Unsaved<BroadcastRequest>) =>
  await putItem<BroadcastRequest>(
    broadcastRequestsTable,
    request
  );
