type MessageLimitDisplayInfo = {
  long: string;
  short: string;
}

export function getMessageLimitDisplayInfo(limit: number): MessageLimitDisplayInfo {
  return limit === Number.POSITIVE_INFINITY
    ? {
      long: "неограниченное количество",
      short: "♾"
    }
    : {
      long: `до ${limit}`,
      short: String(limit)
    };
}
