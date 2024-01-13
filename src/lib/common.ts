export function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === null || typeof value === "undefined") {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

export function toText(...strings: string[]): string {
  return strings.join("\n\n");
}

export function truncate(str: string, limit: number): string {
  return str.length > limit
    ? `${str.substring(0, limit)}...`
    : str;
}

export function first<T>(array: T[]): T | null {
  return !empty(array) ? array[0] : null;
}

export function empty<T>(array: T[]): boolean {
  return array.length === 0;
}
