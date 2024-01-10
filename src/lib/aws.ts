import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { DynamoDBStreamEvent } from "aws-lambda";

export function decodeItem<T>(item: any) {
  return unmarshall(item as { [key: string]: AttributeValue; }) as T;
}

export function processStreamEvent<T>(event: DynamoDBStreamEvent, processor: (entity: T) => void) {
  event.Records.forEach((record) => {
    if (record.eventName !== "INSERT") {
      return;
    }

    const rawItem = record.dynamodb?.NewImage;

    if (!rawItem) {
      return;
    }

    const entity = decodeItem<T>(rawItem);

    processor(entity);
  });
}
