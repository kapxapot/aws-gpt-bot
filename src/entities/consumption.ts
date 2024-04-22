import { Interval } from "./interval";

export type Consumption = {
  count: number;
  limit: number;
};

export type IntervalConsumption = Consumption & {
  interval: Interval;
};

export type IntervalConsumptions = IntervalConsumption[];

export type ConsumptionReport = Consumption | IntervalConsumptions;

export function isIntervalConsumptions(consumptionReport: ConsumptionReport): consumptionReport is IntervalConsumptions {
  return Array.isArray(consumptionReport);
}
