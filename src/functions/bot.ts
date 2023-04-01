import { DynamoDBStreamEvent } from "aws-lambda";
import { decodeItem } from "../lib/aws";
import getBot from "../telegram/bot";

export const handler = (event: DynamoDBStreamEvent) => {
  const bot = getBot();

  event.Records.forEach((record) => {
    if (record.eventName !== "INSERT") {
      return;
    }

    const rawItem = record.dynamodb?.NewImage;

    if (!rawItem) {
      return;
    }

    const item = decodeItem(rawItem);

    bot.handleUpdate(item.request);
  });
};
