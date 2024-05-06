import { Entity } from "../lib/types";

export type BroadcastRequest = Entity & {
  messages?: string[];
  users?: string[];
  resumeRequestId?: string;
  isTest?: boolean;
};
