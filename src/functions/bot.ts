import { DynamoDBStreamEvent } from "aws-lambda";
import { TelegramRequest } from "../entities/telegramRequest";
import { decodeItem } from "../lib/aws";
import { processTelegramRequest } from "../telegram/bot";

export const handler = (event: DynamoDBStreamEvent) => {
  event.Records.forEach((record) => {
    if (record.eventName !== "INSERT") {
      return;
    }

    const rawItem = record.dynamodb?.NewImage;

    if (!rawItem) {
      return;
    }

    const tgRequest = decodeItem<TelegramRequest>(rawItem);

    processTelegramRequest(tgRequest);
  });
};
