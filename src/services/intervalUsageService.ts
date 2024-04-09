import { At, at } from "../entities/at";
import { Interval, intervals } from "../entities/interval";
import { IntervalUsage, IntervalUsages, ModelUsage } from "../entities/modelUsage";
import { settings } from "../lib/constants";
import { startOf } from "./dateService";

export function incIntervalUsage<T extends ModelUsage>(
  modelUsage: T,
  interval: Interval,
  now: At,
  usagePoints: number = settings.defaultUsagePoints
): T {
  const start = startOf(interval, now);
  let intervalUsage = getIntervalUsage(modelUsage, interval);

  if (intervalUsage && intervalUsage.startedAt.timestamp === start) {
    intervalUsage.count += usagePoints;
  } else {
    intervalUsage = buildIntervalUsage(interval, now, usagePoints);
  }

  return setIntervalUsage(modelUsage, interval, intervalUsage);
}

export function buildIntervalUsages(
  now: At,
  usagePoints: number = settings.defaultUsagePoints
): IntervalUsages {
  return intervals.reduce(
    (accum: IntervalUsages, val: Interval) => ({
      ...accum,
      [val]: buildIntervalUsage(val, now, usagePoints)
    }),
    {}
  );
}

export function getIntervalUsage<T extends ModelUsage>(modelUsage: T, interval: Interval): IntervalUsage | null {
  return modelUsage.intervalUsages
    ? modelUsage.intervalUsages[interval] ?? null
    : null;
}

function buildIntervalUsage(interval: Interval, now: At, usagePoints: number): IntervalUsage {
  return {
    startedAt: at(startOf(interval, now)),
    count: usagePoints
  };
}

function setIntervalUsage<T extends ModelUsage>(
  modelUsage: T,
  interval: Interval,
  intervalUsage: IntervalUsage
): T {
  return {
    ...modelUsage,
    intervalUsages: {
      ...modelUsage.intervalUsages,
      [interval]: intervalUsage
    }
  };
}
