import { symbols } from "./constants";

export function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === null || isUndefined(value)) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

export const toText = (...lines: string[]) => lines.join("\n\n");

export const toCompactText = (...lines: string[]) => lines.join("\n");

export function toSanitizedArray(lines: string | string[]): string[] {
  return toArray(lines)
    .map(m => m.trim())
    .filter(m => !!m);
}

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

/**
 * Sanitizes array and joins it using comma and space.
 */
export const commatize = (strings: string | string[]) => toSanitizedArray(strings).join(", ");

export function capitalize(str: string): string {
  if (str.length < 1) {
    return str;
  }

  return str.substring(0, 1).toUpperCase() + str.substring(1);
}

/**
 * Sanitizes the array and adds the bullet symbol to every line.
 */
export const list = (...lines: string[]) => toSanitizedArray(lines)
  .map(line => `${symbols.bullet} ${line}`);

export function homogeneousJoin(
    chunks: string[],
    finalDelimiter?: string,
    commaDelimiter?: string
): string {
  finalDelimiter ??= " и ";
  commaDelimiter ??= ", ";

  // a
  // a и b
  // a, b и c

  let result = "";
  const chunkCount = chunks.length;

  for (let index = 1; index <= chunkCount; index++) {
    const chunk = chunks[chunkCount - index];

    switch (index) {
      case 1:
        result = chunk;
        continue;

      case 2:
        result = `${chunk}${finalDelimiter}${result}`;
        continue;

      default:
        result = `${chunk}${commaDelimiter}${result}`;
    }
  }

  return result;
}

export const andJoin = (...lines: string[]) => homogeneousJoin(lines);

export const orJoin = (...lines: string[]) => homogeneousJoin(lines, " или ");
