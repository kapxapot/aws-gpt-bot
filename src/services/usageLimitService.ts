import { Interval } from "../entities/interval";
import { ModelCode } from "../entities/model";
import { User } from "../entities/user";
import { getPlanSettingsLimit } from "./planSettingsService";
import { getUserPlanSettings } from "./userService";

type UsageLimitDisplayInfo = {
  long: string;
  short: string;
}

export function getUsageLimitDisplayInfo(limit: number, interval?: Interval): UsageLimitDisplayInfo {
  const intervalStr = interval === "day"
    ? "день"
    : interval === "week"
      ? "неделю"
      : "месяц";

  return limit === Number.POSITIVE_INFINITY
    ? {
      long: "неограниченное количество запросов",
      short: "♾"
    }
    : {
      long: `до ${limit} запросов в ${intervalStr}`,
      short: String(limit)
    };
}

export function getUsageLimitString(user: User, modelCode: ModelCode, interval: Interval): string {
  const limit = getUsageLimit(user, modelCode, interval);
  const displayInfo = getUsageLimitDisplayInfo(limit, interval);

  return displayInfo.short;
}

export function getUsageLimit(user: User, modelCode: ModelCode, interval: Interval): number {
  const settings = getUserPlanSettings(user);
  return getPlanSettingsLimit(settings, modelCode, interval);
}
