import { Interval } from "../entities/interval";
import { symbols } from "../lib/constants";
import { formatWordNumber } from "./grammarService";
import { getIntervalString } from "./intervalService";

export function getUsageLimitText(limit: number, interval: Interval): string {
  return limit === Number.POSITIVE_INFINITY
    ? "неограниченное количество запросов"
    : `до ${formatWordNumber("запрос", limit)} в ${getIntervalString(interval, "Accusative")}`;
}

export function formatLimit(limit: number): string {
  return limit === Number.POSITIVE_INFINITY
    ? symbols.infinity
    : String(limit);
}
