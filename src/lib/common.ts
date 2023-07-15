import { User } from "../entities/user";

export function toText(...strings: string[]): string {
  return strings.join("\n\n");
}

export function isDebugMode(user?: User): boolean {
  if (user?.settings?.isDebugMode !== undefined) {
    return user?.settings?.isDebugMode;
  }

  return process.env.DEBUG === "true";
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
