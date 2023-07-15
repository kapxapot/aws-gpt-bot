import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, QueryCommandInput, ScanCommand, ScanCommandInput, ScanCommandOutput, UpdateCommand, UpdateCommandInput } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { timestamps, updatedTimestamps } from "../entities/at";

export function getDynamoDbClient() {
  const marshallOptions = {
    // Whether to automatically convert empty strings, blobs, and sets to `null`.
    convertEmptyValues: false, // false, by default.
    // Whether to remove undefined values while marshalling.
    removeUndefinedValues: true, // false, by default.
    // Whether to convert typeof object to map attribute.
    convertClassInstanceToMap: true, // false, by default.
  };

  const unmarshallOptions = {
    // Whether to return numbers as a string instead of converting them to native JavaScript numbers.
    wrapNumbers: false, // false, by default.
  };

  const translateConfig = { marshallOptions, unmarshallOptions };
  const client = new DynamoDBClient({});

  return DynamoDBDocumentClient.from(client, translateConfig);
}

export async function putItem<T>(table: string, item: any): Promise<T> {
  const params = {
    TableName: table,
    Item: {
      ...item,
      id: item.id ?? uuidv4(),
      ...timestamps()
    }
  };

  const dbClient = getDynamoDbClient();
  await dbClient.send(new PutCommand(params));

  return params.Item as T;
}

export async function getItem<T>(table: string, id: string): Promise<T | null> {
  const params = {
    TableName: table,
    Key: {
      id
    }
  };

  const dbClient = getDynamoDbClient();
  const result = await dbClient.send(new GetCommand(params));

  return fromItem<T>(result.Item);
}

export async function queryItems<T>(
  table: string,
  attributes: Record<string, any>,
  condition: string,
  filter?: string
): Promise<T[]> {
  const params: QueryCommandInput = {
    TableName: table,
    ExpressionAttributeValues: attributes,
    KeyConditionExpression: condition
  };

  if (filter) {
    params.FilterExpression = filter;
  }

  const dbClient = getDynamoDbClient();
  const result = await dbClient.send(new QueryCommand(params));
  const items = result.Items;

  if (!items) {
    return [];
  }

  return items
    .map(item => fromItem<T>(item))
    .filter((item): item is T => item !== null);
}

export async function queryItem<T>(
  table: string,
  attributes: Record<string, any>,
  condition: string,
  filter?: string
): Promise<T | null> {
  const items = await queryItems<T>(table, attributes, condition, filter);

  return items.length ? items[0] : null;
}

export async function getCount(table: string): Promise<number | null> {
  const params: ScanCommandInput = {
    TableName: table,
    Select: "COUNT",
  };

  const dbClient = getDynamoDbClient();
  const result = await dbClient.send(new ScanCommand(params));

  return result.ScannedCount || null;
}

export async function scanItem<T>(
  table: string,
  filter: string,
  attributes: Record<string, any>,
  projection?: string
): Promise<T | null> {
  const items = await scanItems<T>(table, filter, attributes, projection);

  return items.length ? items[0] : null;
}

export async function scanItems<T>(
  table: string,
  filter?: string,
  attributes?: Record<string, any>,
  projection?: string
): Promise<T[]> {
  const params: ScanCommandInput = {
    TableName: table,
    FilterExpression: filter,
    ExpressionAttributeValues: attributes,
    ProjectionExpression: projection,
  };

  const dbClient = getDynamoDbClient();

  let items: Record<string, any>[] = [];
  let lastKey;

  do {
    const result: ScanCommandOutput = await dbClient.send(new ScanCommand({
      ...params,
      ExclusiveStartKey: lastKey,
    }));

    if (!result.Items) {
      break;
    }

    lastKey = result.LastEvaluatedKey;
    items = items.concat(result.Items);
  } while (lastKey);

  return items
    .map(item => fromItem<T>(item))
    .filter((item): item is T => item !== null);
}

export async function updateItem<T>(
  table: string,
  key: Record<string, any>,
  attributes: Record<string, any>
): Promise<T> {
  const updatedAttributes = {
    ...attributes,
    ...updatedTimestamps()
  };

  const params: UpdateCommandInput = {
    TableName: table,
    Key: key,
    UpdateExpression: recordToSetExpression(updatedAttributes),
    ReturnValues: "ALL_NEW"
  };

  params.ExpressionAttributeNames = recordToAttributeNames(updatedAttributes);
  params.ExpressionAttributeValues = recordToAttributeValues(updatedAttributes);

  const dbClient = getDynamoDbClient();
  const result = await dbClient.send(new UpdateCommand(params));

  return result.Attributes as T;
}

export async function removeFromItem<T>(
  table: string,
  key: Record<string, any>,
  attributes: string[]
): Promise<T> {
  const params: UpdateCommandInput = {
    TableName: table,
    Key: key,
    UpdateExpression: attributesToRemoveExpression(attributes),
    ReturnValues: "ALL_NEW"
  };

  const dbClient = getDynamoDbClient();
  const result = await dbClient.send(new UpdateCommand(params));

  return result.Attributes as T;
}

export async function deleteItem<T>(table: string, id: string): Promise<T> {
  const params = {
    TableName: table,
    Key: {
      id
    }
  };

  const dbClient = getDynamoDbClient();
  const result = await dbClient.send(new DeleteCommand(params));

  return result.Attributes as T;
}

function fromItem<T>(item: Record<string, any> | undefined): T | null {
  return item ? item as T : null;
}

function recordToSetExpression(record: Record<string, any>): string {
  const chunks = [];

  for (const [key, value] of Object.entries(record)) {
    chunks.push(`#${key} = :${key}`);
  }

  if (!chunks.length) {
    return "";
  }

  return "set " + chunks.join(", ");
}

function recordToAttributeNames(record: Record<string, any>): Record<string, string> {
  let result: Record<string, string> = {};

  for (const [key, value] of Object.entries(record)) {
    result[`#${key}`] = key;
  }

  return result;
}

function recordToAttributeValues(record: Record<string, any>): Record<string, any> {
  let result: Record<string, any> = {};

  for (const [key, value] of Object.entries(record)) {
    result[`:${key}`] = value;
  }

  return result;
}

function attributesToRemoveExpression(attributes: string[]): string {
  return `remove ${attributes.join(", ")}`;
}
