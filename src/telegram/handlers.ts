import { isDebugMode } from "../lib/common";
import { commands, messages, scenes } from "../lib/constants";
import { inspect } from "util";
import { clearInlineKeyboard, reply } from "../lib/telegram";
import { BotContext } from "./context";
import { Composer } from "telegraf";

type HandlerTuple = [command: string, handler: (ctx: any) => Promise<void>];

export function addOtherCommandHandlers(scene: Composer<BotContext>, exceptCommand: string) {
  getOtherCommandHandlers(exceptCommand).forEach(tuple => {
    scene.command(tuple[0], async (ctx) => {
      await clearInlineKeyboard(ctx);
      await ctx.scene.leave();
      await tuple[1](ctx);
    });
  });

  scene.command(exceptCommand, async (ctx) => {
    await ctx.reply(`Вы уже находитесь в диалоге этой команды. ${messages.useTheKeyboard}`);
  });
}

function getOtherCommandHandlers(command: string): HandlerTuple[] {
  return getCommandHandlers().filter(tuple => tuple[0] !== command);
}

export function getCommandHandlers(): HandlerTuple[] {
  return [
    [commands.terms, termsHandler],
    [commands.support, supportHandler],
    [commands.tutorial, tutorialHandler],
    [commands.prompt, promptHandler],
    [commands.premium, premiumHandler],
  ];
}

async function termsHandler(ctx: any) {
  await ctx.reply(process.env.TERMS_URL!);
}

async function supportHandler(ctx: any) {
  await reply(
    ctx,
    "Напишите в техподдержку, чтобы получить ответ на ваш вопрос или обсудить идеи по развитию чат-бота под ваши задачи.",
    process.env.SUPPORT_URL!
  );
}

async function tutorialHandler(ctx: any) {
  await ctx.scene.enter(scenes.tutorial);
}

async function promptHandler(ctx: any) {
  await ctx.scene.enter(scenes.prompt);
}

async function premiumHandler(ctx: any) {
  await ctx.scene.enter(scenes.premium);
}

export async function kickHandler(ctx: any) {
  const myChatMember = ctx.myChatMember;

  if (myChatMember) {
    if (["kicked", "left"].includes(myChatMember.new_chat_member.status)) {
      ctx.session = {};
    }
  }
}

export async function dunnoHandler(ctx: any) {
  if (isDebugMode()) {
    await ctx.reply(inspect(ctx));
  }

  await ctx.reply(`Я не понял ваш запрос. ${messages.useTheKeyboard}`);
}
