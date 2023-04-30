export function toText(...strings: string[]): string {
  return strings.join("\n\n");
}

export function isDebugMode(): boolean {
  return process.env.DEBUG === "true";
}
