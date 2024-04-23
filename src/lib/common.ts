import { symbols } from "./constants";

export function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === null || isUndefined(value)) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

export function toText(...strings: string[]): string {
  return strings.join("\n\n");
}

export function toCompactText(...strings: string[]): string {
  return strings.join("\n");
}

export function toSanitizedArray(strings: string | string[]): string[] {
  return toArray(strings)
    .map(m => m.trim())
    .filter(m => !!m);
}

/**
 * Sanitizes array and joins it using comma and space.
 */
export const commatize = (strings: string | string[]) => toSanitizedArray(strings).join(", ");

export function truncate(str: string, limit: number): string {
  return str.length > limit
    ? `${str.substring(0, limit)}...`
    : str;
}

export function first<T>(array: T[]): T | null {
  return !isEmpty(array) ? array[0] : null;
}

function isEmpty<T>(array: T[]): boolean {
  return array.length === 0;
}

export function phoneToItu(phone: string | undefined): string | null {
  if (!phone) {
    return null;
  }

  return phone.replace(/\D/g, '') || null;
}

export function isNumber(v: unknown): v is number {
  return typeof v === "number";
}

export function isUndefined(v: unknown): v is undefined {
  return typeof v === "undefined";
}

export function capitalize(str: string): string {
  if (str.length < 1) {
    return str;
  }

  return str.substring(0, 1).toUpperCase() + str.substring(1);
}

export const list = (...lines: string[]) => lines.map(line => `${symbols.bullet} ${line}`);
