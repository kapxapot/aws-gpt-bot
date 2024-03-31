import { Timestamps } from "../entities/at";

export type Id = {
  id: string;
};

export type Timestampless<T extends Timestamps> = Omit<T, keyof Timestamps>;

export type Entity = Id & Timestamps;

export type Unsaved<T extends Entity> = Omit<T, keyof Entity> & Partial<Id>;

export type PartialRecord<TKey extends string | number | symbol, TValue> =
  Partial<Record<TKey, TValue>>;
