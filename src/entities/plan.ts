import { settings } from "../lib/constants";

export type Plan = "free" | "premium" | "unlimited";

export function getPlanDailyMessageLimit(plan: Plan): number {
  switch (plan) {
    case "free":
      return settings.messageLimits.free;

    case "premium":
      return settings.messageLimits.premium;

    case "unlimited":
      return Number.POSITIVE_INFINITY;
  }
}
