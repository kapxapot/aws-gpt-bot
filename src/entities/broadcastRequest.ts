import { Entity } from "../lib/types";

export type BroadcastRequest = Entity & {
  messages?: string[];
  userIds?: string[];
  resumeRequestId?: string;
  isTest?: boolean;
};
