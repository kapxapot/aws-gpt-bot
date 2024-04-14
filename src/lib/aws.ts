import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { DynamoDBStreamEvent } from "aws-lambda";

export function decodeItem<T>(item: unknown) {
  return unmarshall(item as { [key: string]: AttributeValue; }) as T;
}

export async function processStreamEvent<T>(
  event: DynamoDBStreamEvent,
  processor: (entity: T) => Promise<void>
): Promise<void> {
  for (const record of event.Records) {
    if (record.eventName !== "INSERT") {
      continue;
    }

    const rawItem = record.dynamodb?.NewImage;

    if (!rawItem) {
      continue;
    }

    const entity = decodeItem<T>(rawItem);

    await processor(entity);
  }
}
