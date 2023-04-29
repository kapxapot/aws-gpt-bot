export function timestamp(): number {
  return new Date().getTime();
}

export function timestampToString(epoch: number): string {
  return new Date(epoch).toISOString();
}

export function toText(...strings: string[]): string {
  return strings.join("\n\n");
}

export function isDebugMode(): boolean {
  return process.env.DEBUG === "true";
}
