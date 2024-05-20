import { Entity } from "../lib/types";
import { At } from "./at";

export type BroadcastSuccessStatus = "success" | "test";

type Success = {
  status: BroadcastSuccessStatus;
};

type Fail = {
  status: "fail";
  error: unknown;
};

type SendResult = Success | Fail;

export type BroadcastMessage = Entity & {
  message: string;
  requestId: string;
  userId: string;
  isTest?: boolean;
  sentAt?: At;
  sendResult?: SendResult;
};
