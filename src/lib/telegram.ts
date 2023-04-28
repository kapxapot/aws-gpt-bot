import { User } from "telegraf/types";

export function userName(user: User): string {
  return user.first_name ?? user.last_name ?? user.username ?? "anonymous";
}

export const clearInlineKeyboard = async (ctx: any) => {
  try {
    await ctx.answerCbQuery();
  } catch {}

  try {
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
  } catch {}
}

export function sliceButtons<T>(buttons: T[], limit: number = 2): T[][] {
  const result = [];

  for (let i = 0; i < buttons.length; i += limit) {
    result.push(
      buttons.slice(i, i + limit)
    );
  }

  return result;
}
