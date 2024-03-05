import { User } from "../entities/user";
import { getUserMessageLimit } from "./userService";

type MessageLimitDisplayInfo = {
  long: string;
  short: string;
}

export function getMessageLimitDisplayInfo(limit: number): MessageLimitDisplayInfo {
  return limit === Number.POSITIVE_INFINITY
    ? {
      long: "неограниченное количество запросов",
      short: "♾"
    }
    : {
      long: `до ${limit} запросов в сутки`,
      short: String(limit)
    };
}

export function getMessageLimitString(user: User): string {
  const limit = getUserMessageLimit(user);
  const displayInfo = getMessageLimitDisplayInfo(limit);

  return displayInfo.short;
}
