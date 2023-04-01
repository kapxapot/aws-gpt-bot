import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import express from "express";
import serverless from "serverless-http";
import { v4 as uuidv4 } from "uuid";
import { timestamp } from "../lib/common";

const app = express();

const telegramRequestsTable = process.env.TELEGRAM_REQUESTS_TABLE;
const client = new DynamoDBClient({});
const dynamoDbClient = DynamoDBDocumentClient.from(client);

app.use(express.json());

app.post("/bot", async function (req, res) {
  const params = {
    TableName: telegramRequestsTable,
    Item: {
      id: uuidv4(),
      request: req.body,
      createdAt: timestamp()
    }
  };

  try {
    await dynamoDbClient.send(new PutCommand(params));
    res.status(200).end();
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to save telegram request." });
  }
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not found.",
  });
});

export const handler = serverless(app);
