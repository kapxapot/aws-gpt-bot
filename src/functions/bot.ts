import { DynamoDBStreamEvent } from "aws-lambda";
import { TelegramRequest } from "../entities/telegramRequest";
import { processStreamEvent } from "../lib/aws";
import { processTelegramRequest } from "../telegram/bot";

export const handler = (event: DynamoDBStreamEvent) => processStreamEvent(
  event,
  async (tgRequest: TelegramRequest) => await processTelegramRequest(tgRequest)
);
