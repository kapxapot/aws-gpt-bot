import { InlineKeyboardButton, User } from "telegraf/types";
import { toText } from "./common";
import { Markup } from "telegraf";

export function userName(user: User): string {
  return user.first_name ?? user.last_name ?? user.username ?? "anonymous";
}

type Button = InlineKeyboardButton.CallbackButton;

export function inlineKeyboard(...buttonData: string[][]) {
  const buttons: Button[] = buttonData.map(data => Markup.button.callback(data[0], data[1]));

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

export function sliceButtons<T extends Button>(buttons: T[], limit: number = 2, maxLength: number = 18): T[][] {
  const result = [];
  let accumulator: T[] = [];

  function flush() {
    if (!accumulator.length) {
      return;
    }

    result.push(accumulator);
    accumulator = [];
  }

  for (const button of buttons) {
    if (button.text.length > maxLength) {
      flush();
      result.push([button]);

      continue;
    }

    accumulator.push(button);

    if (accumulator.length == limit) {
      flush();
    }
  }

  flush();

  return result;
}

export async function reply(ctx: any, ...lines: string[]) {
  await ctx.replyWithHTML(toText(...lines));
}
