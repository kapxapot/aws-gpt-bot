export function userName(ctx: any): string {
  const from = ctx.from;

  return from.first_name ?? from.last_name ?? from.username ?? "аноним";
}
