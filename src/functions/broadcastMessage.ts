import { DynamoDBStreamEvent } from "aws-lambda";
import { processStreamEvent } from "../lib/aws";
import { BroadcastMessage } from "../entities/broadcastMessage";
import { sendBroadcastMessage } from "../services/broadcastService";

export const handler = async (event: DynamoDBStreamEvent) => await processStreamEvent(
  event,
  async (message: BroadcastMessage) => await sendBroadcastMessage(message)
);
