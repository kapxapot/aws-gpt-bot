export function toText(...strings: string[]): string {
  return strings.join("\n\n");
}

export function isDebugMode(): boolean {
  return process.env.DEBUG === "true";
}

export function truncate(str: string, limit: number): string {
  return str.length > limit
    ? `${str.substring(0, limit)}...`
    : str;
}
