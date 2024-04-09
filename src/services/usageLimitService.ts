import { Interval } from "../entities/interval";
import { getCaseByNumber } from "./grammarService";
import { getIntervalString } from "./intervalService";

export function getUsageLimitText(limit: number, interval: Interval): string {
  return limit === Number.POSITIVE_INFINITY
    ? "неограниченное количество запросов"
    : `до ${limit} ${getCaseByNumber("запрос", limit)} в ${getIntervalString(interval, "Accusative")}`;
}

export function formatLimit(limit: number): string {
  return limit === Number.POSITIVE_INFINITY
    ? "♾"
    : String(limit);
}
