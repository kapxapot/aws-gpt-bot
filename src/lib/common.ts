import { AnyRecord, DefinedUndefined } from "./types";

type Like<T> = T | null | undefined;
export type StringLike = Like<string>;

/**
 * Trims lines and filters all empty values.
 */
export const clean = (lines: StringLike[]) =>
  lines
    .map(l => l ? l.trim() : "")
    .filter(l => !!l);

export function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === null || isUndefined(value)) {
    return [];
  }
  
  return Array.isArray(value) ? value : [value];
}

export const toCleanArray = (lines: string | string[]) =>
  clean(toArray(lines));

export function first<T>(array: T[]): T | null {
  return !isEmpty(array) ? array[0] : null;
}

export function last<T>(array: T[]): T | null {
  return !isEmpty(array) ? array[array.length - 1] : null;
}

export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

export function phoneToItu(phone: string | undefined): string | null {
  if (!phone) {
    return null;
  }

  return phone.replace(/\D/g, '') || null;
}

export function isNumeric(str: string): boolean {
  return /^\d+$/.test(str);
}

export function isNumber(v: unknown): v is number {
  return typeof v === "number";
}

export function isUndefined(v: unknown): v is undefined {
  return typeof v === "undefined";
}

export const isEmpty = <T>(array?: T[]) => !array || !array.length;

export function toFixedOrInt(num: number, digits?: number): number {
  return Number(toFixedOrIntStr(num, digits));
}

export function toFixedOrIntStr(num: number, digits?: number): string {
  const fixed = num.toFixed(digits);

  if (!digits || digits === 0) {
    return fixed;
  }

  const fixedNum = Number(fixed);
  const truncated = Math.trunc(fixedNum);
  const fraction = fixedNum - truncated;

  let epsilon = 1;

  for (let i = 0; i < digits; i++) {
    epsilon /= 10;
  }

  return (toFixed(fraction, digits) < epsilon)
    ? String(truncated)
    : fixed;
}

export function toFixed(num: number, digits?: number): number {
  return Number(num.toFixed(digits));
}

/**
 * Checks if all entries of `objData` are the same in `obj`.
 */
export function dataEquals<T extends AnyRecord>(obj: T, objData: Partial<T>): boolean {
  const keys = Object.keys(objData);

  for (const key of keys) {
    if (obj[key] !== objData[key]) {
      return false;
    }
  }

  return true;
}

export function extractUndefined(obj: AnyRecord): DefinedUndefined<AnyRecord> {
  const def: AnyRecord = {};
  const undef: string[] = [];

  const keys = Object.keys(obj);

  for (const key of keys) {
    if (obj[key] === undefined) {
      undef.push(key);
    } else {
      def[key] = obj[key];
    }
  }

  return { def, undef };
}
