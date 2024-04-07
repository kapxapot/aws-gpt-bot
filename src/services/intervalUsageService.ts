import { At, at } from "../entities/at";
import { Interval, intervals } from "../entities/interval";
import { IntervalUsage, IntervalUsages, ModelUsage } from "../entities/modelUsage";
import { startOf } from "./dateService";

export function incIntervalUsage<T extends ModelUsage>(modelUsage: T, interval: Interval, now: At): T {
  const start = startOf(interval, now);
  let intervalUsage = getIntervalUsage(modelUsage, interval);

  if (intervalUsage && intervalUsage.startedAt.timestamp === start) {
    intervalUsage.count++;
  } else {
    intervalUsage = buildIntervalUsage(interval, now);
  }

  return setIntervalUsage(modelUsage, interval, intervalUsage);
}

export function buildIntervalUsages(now: At): IntervalUsages {
  return intervals.reduce(
    (accum: IntervalUsages, val: Interval) => ({
      ...accum,
      [val]: buildIntervalUsage(val, now)
    }),
    {}
  );
}

export function getIntervalUsage<T extends ModelUsage>(modelUsage: T, interval: Interval): IntervalUsage | null {
  return modelUsage.intervalUsages
    ? modelUsage.intervalUsages[interval] ?? null
    : null;
}

function buildIntervalUsage(interval: Interval, now: At): IntervalUsage {
  return {
    startedAt: at(startOf(interval, now)),
    count: 1
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
