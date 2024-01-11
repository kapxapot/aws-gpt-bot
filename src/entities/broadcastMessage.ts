import { At, Timestamps } from "./at";

export interface BroadcastMessage extends Timestamps {
  id: string;
  message: string;
  userId: string;
  sentAt?: At;
  sendResult?: {
    status: "success";
  } | {
    status: "fail";
    error: unknown;
  }
}
