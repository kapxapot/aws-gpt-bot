import express from "express";
import serverless from "serverless-http";
import { storeTelegramRequest } from "../storage/telegramRequests";

const app = express();

app.use(express.json());

app.post("/bot", async function (req, res) {
  try {
    await storeTelegramRequest(req.body);
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
