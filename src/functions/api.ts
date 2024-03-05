import express from "express";
import serverless from "serverless-http";
import { botHook } from "../webhooks/botHook";
import { youMoneyHook } from "../webhooks/yooMoneyHook";
import { Request, Response } from "express-serve-static-core/index";
import { ParsedQs } from "qs";
import { broadcastHook } from "../webhooks/broadcastHook";
import { isDebugMode } from "../services/userSettingsService";
import { putMetric } from "../services/metricService";

type ApiRequest = Request<object, unknown, unknown, ParsedQs, Record<string, unknown>>;
type ApiResponse = Response<unknown, Record<string, unknown>, number>;
type HandlerFunc<T> = (reqBody: T) => Promise<void>;

type ErrorResult = {
  error: string,
  message?: string
};

async function handle<T>(req: ApiRequest, res: ApiResponse, func: HandlerFunc<T>) {
  try {
    await func(req.body as T);

    res.status(200).end();
  } catch (error) {
    console.error(error);
    await putMetric("Error");
    await putMetric("ApiProcessingError");

    const errorResult: ErrorResult = {
      error: "Failed to process the request."
    };

    if (isDebugMode() && error instanceof Error) {
      errorResult.message = error.message;
    }

    res.status(500).json(errorResult);
  }
}

const app = express();

app.use(express.json());

app.post("/bot", async function (req: ApiRequest, res: ApiResponse) {
  console.log("Received a Telegram request.");

  if (isDebugMode()) {
    console.log(req);
  }

  await handle(req, res, botHook);
});

app.post("/yoomoney", async function (req: ApiRequest, res: ApiResponse) {
  console.log("Received a YooMoney request.");

  if (isDebugMode()) {
    console.log(req);
  }

  await handle(req, res, youMoneyHook);
});

app.post("/broadcast", async function (req: ApiRequest, res: ApiResponse) {
  console.log("Received a broadcast request.");

  if (isDebugMode()) {
    console.log(req);
  }

  await handle(req, res, broadcastHook);
});

app.use((req: ApiRequest, res: ApiResponse) => {
  return res.status(404).json({
    error: "Not found.",
  });
});

export const handler = serverless(app);
