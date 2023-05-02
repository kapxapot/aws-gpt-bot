import { InlineKeyboardButton, InlineKeyboardMarkup, User } from "telegraf/types";
import { toText } from "./common";
import { Markup } from "telegraf";

const maxMessageLength = 4096;

export function userName(user: User): string {
  return user.first_name ?? user.last_name ?? user.username ?? "anonymous";
}

type Button = InlineKeyboardButton.CallbackButton;

export function inlineKeyboard(...buttonData: string[][]): Markup.Markup<InlineKeyboardMarkup> {
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
  const slices = sliceText(toText(...lines), maxMessageLength);

  for (const slice of slices) {
    await ctx.replyWithHTML(slice);
  }
}

export async function replyWithKeyboard(
  ctx: any,
  keyboard: Markup.Markup<InlineKeyboardMarkup>,
  ...lines: string[]
) {
  const slices = sliceText(toText(...lines), maxMessageLength);

  for (let i = 0; i < slices.length; i++) {
    if (i !== slices.length - 1) {
      await ctx.replyWithHTML(slices[i]);
    } else {
      await ctx.replyWithHTML(slices[i], keyboard);
    }
  }
}

function sliceText(text: string, limit: number): string[] {
  const result: string[] = [];

  while (text.length) {
    const chunk = text.substring(0, limit);
    result.push(chunk);

    text = text.substring(limit);
  }

  return result;
}
