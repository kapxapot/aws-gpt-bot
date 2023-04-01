import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

export function decodeItem(item: any) {
  return unmarshall(item as { [key: string]: AttributeValue; });
}
