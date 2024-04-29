import { Interval } from "./interval";

export type ConsumptionLimit = Readonly<{
  limit: Readonly<number>;
  consumed: number;
  remaining: Readonly<number>; // limit - consumed
}>;

export type IntervalConsumptionLimit = ConsumptionLimit & {
  interval: Interval;
};

export type IntervalConsumptionLimits = IntervalConsumptionLimit[];

export type ConsumptionLimits = ConsumptionLimit | IntervalConsumptionLimits;
