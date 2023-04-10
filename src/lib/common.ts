export function timestamp(): number {
  return new Date().getTime();
}

export function timestampToString(epoch: number): string {
  return new Date(epoch).toISOString();
}
