import express from "express";
import serverless from "serverless-http";
import { botHook } from "../webhooks/botHook";
import { youMoneyHook } from "../webhooks/yooMoneyHook";

const app = express();

app.use(express.json());

app.post("/bot", async function (req, res) {
  console.log("Received a Telegram request.");

  try {
    await botHook(req.body);

    res.status(200).end();
  } catch (error) {
    console.log(error);

    res.status(500).json({ error: "Failed to process your request." });
  }
});

app.post("/yoomoney", async function (req, res) {
  console.log("Received a YooMoney request.");

  try {
    await youMoneyHook(req.body);

    res.status(200).end();
  } catch (error) {
    console.log(error);

    res.status(500).json({ error: "Failed to process your request." });
  }
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not found.",
  });
});

export const handler = serverless(app);
