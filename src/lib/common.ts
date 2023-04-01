export function userName(ctx: any): string {
  const from = ctx.from;

  return from.first_name ?? from.last_name ?? from.username ?? "аноним";
}

export function timestamp(): number {
  return new Date().getTime();
}

export function timestampToString(epoch: number): string {
  return new Date(epoch).toISOString();
}
