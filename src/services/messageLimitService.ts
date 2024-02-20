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
