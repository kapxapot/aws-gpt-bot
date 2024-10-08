import { InlineKeyboardButton, InlineKeyboardMarkup, Message, ReplyKeyboardMarkup, ReplyKeyboardRemove } from "telegraf/types";
import { StringLike, last } from "./common";
import { Markup, TelegramError } from "telegraf";
import { settings } from "./constants";
import { BotContext } from "../telegram/botContext";
import { text } from "./text";

type PseudoButton = {
  label: string;
  action: string;
  fullWidth?: boolean;
};

export type ButtonLike = InlineKeyboardButton | PseudoButton;

type InlineKeyboard = Markup.Markup<InlineKeyboardMarkup>;

type CommandWithArgs = {
  command: string;
  args: string[];
};

export const inlineKeyboard = (...buttonLikes: ButtonLike[]) =>
  Markup.inlineKeyboard(
    sliceButtons(buttonLikes)
  );

export async function clearInlineKeyboard(ctx: BotContext) {
  try {
    await ctx.answerCbQuery();
  } catch { /* empty */ }

  try {
    await ctx.editMessageReplyMarkup(undefined);
  } catch { /* empty */ }
}

/**
 * Clear the inline keyboard and leave the current scene.
 */
export async function clearAndLeave(ctx: BotContext) {
  await clearInlineKeyboard(ctx);
  await ctx.scene.leave();
}

export function emptyKeyboard(): Markup.Markup<ReplyKeyboardRemove> {
  return Markup.removeKeyboard();
}

export function contactKeyboard(label: string): Markup.Markup<ReplyKeyboardMarkup> {
  return Markup.keyboard([
    Markup.button.contactRequest(label)
  ]).resize();
}

export async function reply(
  ctx: BotContext,
  ...lines: StringLike[]
): Promise<Message.TextMessage[]> {
  const slices = sliceText(text(...lines));
  return await replyWithSlices(ctx, slices);
}

export async function replyWithKeyboard(
  ctx: BotContext,
  keyboard: InlineKeyboard | null,
  ...lines: StringLike[]
): Promise<Message.TextMessage[]> {
  if (!keyboard) {
    return await reply(ctx, ...lines);
  }

  const slices = sliceText(text(...lines));
  const lastSlice = last(slices);

  if (!lastSlice) {
    return [];
  }

  const otherSlices = slices.slice(0, -1);
  const messages = await replyWithSlices(ctx, otherSlices);

  messages.push(
    await ctx.replyWithHTML(lastSlice, keyboard)
  );

  return messages;
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

export function parseCommandWithArgs(text: string): CommandWithArgs {
  const parts = text.trim().split(/\s+/);

  return {
    command: parts[0].replace("/", ""),
    args: parts.slice(1)
  };
}

export function extractArgs(ctx: BotContext): string[] | null {
  if (!ctx.message || !("text" in ctx.message)) {
    return null;
  }

  const { args } = parseCommandWithArgs(ctx.message.text);

  return args;
}

export function isTelegramError(error: unknown): error is TelegramError {
  return error instanceof TelegramError;
}

async function replyWithSlices(ctx: BotContext, slices: string[]): Promise<Message.TextMessage[]> {
  const messages = [];

  for (const slice of slices) {
    messages.push(
      await ctx.replyWithHTML(slice)
    );
  }

  return messages;
}

function sliceButtons(
  buttonLikes: ButtonLike[],
  limit: number = 2,
  maxLength: number = settings.telegram.maxButtonTextLength
): InlineKeyboardButton[][] {
  const result: InlineKeyboardButton[][] = [];
  let accumulator: InlineKeyboardButton[] = [];

  function flush() {
    if (!accumulator.length) {
      return;
    }

    result.push(accumulator);
    accumulator = [];
  }

  for (const buttonLike of buttonLikes) {
    const button = buttonLikeToButton(buttonLike);

    if (
      !isPseudoButton(buttonLike)
      || buttonLike.fullWidth
      || buttonLike.label.length > maxLength
    ) {
      flush();
      result.push([button]);

      continue;
    }

    accumulator.push(button);

    if (accumulator.length === limit) {
      flush();
    }
  }

  flush();

  return result;
}

function buttonLikeToButton(buttonLike: ButtonLike) {
  if (isPseudoButton(buttonLike)) {
    return Markup.button.callback(buttonLike.label, buttonLike.action);
  }

  return buttonLike;
}

function isPseudoButton(buttonLike: ButtonLike): buttonLike is PseudoButton {
  return "label" in buttonLike;
}
