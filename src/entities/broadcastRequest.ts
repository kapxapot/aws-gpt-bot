import { Entity, Language } from "../lib/types";

export type Messages = string[];
export type MultilingualMessages = Record<Language, Messages>;
export type BroadcastRequestMessages = Messages | MultilingualMessages;

export type BroadcastRequest = Entity & {
  messages?: BroadcastRequestMessages;
  userIds?: string[];
  resumeRequestId?: string;
  isTest?: boolean;
};
