import { Entity } from "../lib/types";
import { At } from "./at";

type Success = {
  status: "success" | "test";
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
