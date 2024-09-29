import express from "express";
import serverless from "serverless-http";
import { ParsedQs } from "qs";
import { Request, Response } from "express-serve-static-core/index";
import { isDebugMode } from "../services/userSettingsService";
import { putMetric } from "../services/metricService";
import { storeTelegramRequest } from "../storage/telegramRequestStorage";
import { yooMoneyHandler } from "./apiHandlers/yooMoneyHandler";
import { broadcastHandler } from "./apiHandlers/broadcastHandler";
import { couponHandler } from "./apiHandlers/couponHandler";
import { AnyRecord } from "../lib/types";

type ApiRequest = Request<object, unknown, unknown, ParsedQs, AnyRecord>;
type ApiResponse = Response<unknown, AnyRecord, number>;
type HandlerFunc<T> = (reqBody: T) => Promise<void>;

type ErrorResult = {
  error: string,
  message?: string
};

type Endpoint = {
  url: string;
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (requestData: any) => Promise<void>;
};

const endpoints: Endpoint[] = [
  {
    url: "/bot",
    message: "Received a Telegram request.",
    handler: async requestData => {
      await storeTelegramRequest(requestData);
    }
  },
  {
    url: "/yoomoney",
    message: "Received a YooMoney request.",
    handler: yooMoneyHandler
  },
  {
    url: "/broadcast",
    message: "Received a broadcast request.",
    handler: broadcastHandler
  },
  {
    url: "/coupon",
    message: "Received a coupon request.",
    handler: couponHandler
  }
];

const app = express();

app.use(express.json());

for (const endpoint of endpoints) {
  app.post(endpoint.url, async function (req: ApiRequest, res: ApiResponse) {
    console.log(endpoint.message);
  
    if (isDebugMode()) {
      console.log(req);
    }
  
    await handle(req, res, endpoint.handler);
  });
}

app.use((req: ApiRequest, res: ApiResponse) => {
  return res.status(404).json({
    error: "Not found.",
  });
});

export const handler = serverless(app);

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
