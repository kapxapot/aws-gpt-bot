import { PartialRecord } from "../lib/types";
import { At } from "./at";
import { Interval } from "./interval";
import { ModelCode } from "./model";

export type IntervalUsage = {
  startedAt: At;
  count: number;
}

export type IntervalUsages = PartialRecord<Interval, IntervalUsage>;

export type ModelUsage = {
  intervalUsages: IntervalUsages;
}

export type UserModelUsage = ModelUsage & {
  lastUsedAt: At;
}

export type UserModelUsages = PartialRecord<ModelCode, UserModelUsage>;

export type ProductModelUsage = ModelUsage & {
  count: number;
};

export type ProductUsage = PartialRecord<ModelCode, ProductModelUsage>;
