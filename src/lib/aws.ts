import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

export function decodeItem<T>(item: any) {
  return unmarshall(item as { [key: string]: AttributeValue; }) as T;
}
