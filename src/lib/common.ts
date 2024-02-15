export function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === null || typeof value === "undefined") {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

export function toText(...strings: string[]): string {
  return strings.join("\n\n");
}

export function toSanitizedArray(strings: string | string[]): string[] {
  return toArray(strings)
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
