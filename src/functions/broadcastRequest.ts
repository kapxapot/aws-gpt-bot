import { DynamoDBStreamEvent } from "aws-lambda";
import { processStreamEvent } from "../lib/aws";
import { BroadcastRequest } from "../entities/broadcastRequest";
import { processBroadcastRequest } from "../services/broadcastService";

export const handler = async (event: DynamoDBStreamEvent) => await processStreamEvent(
  event,
  async (request: BroadcastRequest) => await processBroadcastRequest(request)
);
