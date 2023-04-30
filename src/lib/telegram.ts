import { User } from "telegraf/types";
import { toText } from "./common";
import { Markup } from "telegraf";

export function userName(user: User): string {
  return user.first_name ?? user.last_name ?? user.username ?? "anonymous";
}

export function inlineKeyboard(...buttonData: string[][]) {
  const buttons = buttonData.map(data => Markup.button.callback(data[0], data[1]));

  return Markup.inlineKeyboard(
    sliceButtons(buttons)
  );
}

export async function clearInlineKeyboard(ctx: any) {
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

export async function reply(ctx: any, ...lines: string[]) {
  await ctx.replyWithHTML(toText(...lines));
}
