export type Plan = "free" | "premium" | "unlimited";

export function getPlanDailyMessageLimit(plan: Plan): number {
  switch (plan) {
    case "free":
      return 20;

    case "premium":
      return 100;

    case "unlimited":
      return Number.POSITIVE_INFINITY;
  }
}
