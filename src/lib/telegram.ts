import he from "he";
import { InlineKeyboardButton, InlineKeyboardMarkup, Message, User } from "telegraf/types";
import { toText } from "./common";
import { Markup } from "telegraf";
import { settings } from "./constants";

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
    await ctx.editMessageReplyMarkup();
  } catch {}
}

export function sliceButtons<T extends Button>(buttons: T[], limit: number = 2, maxLength: number = settings.telegram.maxButtonTextLength): T[][] {
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

export async function reply(ctx: any, ...lines: string[]): Promise<Message.TextMessage[]> {
  const slices = sliceText(toText(...lines));

  const messages = [];

  for (const slice of slices) {
    messages.push(
      await ctx.replyWithHTML(slice)
    );
  }

  return messages;
}

export async function replyWithKeyboard(
  ctx: any,
  keyboard: Markup.Markup<InlineKeyboardMarkup>,
  ...lines: string[]
) {
  const slices = sliceText(toText(...lines));

  for (let i = 0; i < slices.length; i++) {
    if (i !== slices.length - 1) {
      await ctx.replyWithHTML(slices[i]);
    } else {
      await ctx.replyWithHTML(slices[i], keyboard);
    }
  }
}

export function encodeText(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function sliceText(text: string, limit: number = settings.telegram.maxMessageLength): string[] {
  const result: string[] = [];

  while (text.length) {
    let chunk = text.substring(0, limit);

    // if not last chunk
    if (text.length > limit) {
      const lastSemicolon = chunk.lastIndexOf(";");

      if (lastSemicolon >= 0) {
        chunk = text.substring(0, lastSemicolon + 1);
      }
    }

    result.push(chunk);

    text = text.substring(chunk.length);
  }

  return result;
}

interface CommandWithArgs {
  command: string;
  args: string[];
}

export function parseCommandWithArgs(text: string): CommandWithArgs {
  const parts = text.trim().split(/\s+/);

  return {
    command: parts[0].replace("/", ""),
    args: parts.slice(1)
  };
}
