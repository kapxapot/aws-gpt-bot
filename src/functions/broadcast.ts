import { DynamoDBStreamEvent } from "aws-lambda";
import { processStreamEvent } from "../lib/aws";
import { BroadcastMessage } from "../entities/broadcastMessage";
import { sendBroadcastMessage } from "../services/broadcastMessageService";

export const handler = (event: DynamoDBStreamEvent) => processStreamEvent(
  event,
  (message: BroadcastMessage) => sendBroadcastMessage(message)
);
