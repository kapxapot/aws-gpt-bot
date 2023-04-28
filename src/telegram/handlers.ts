import { isDebugMode, toText } from "../lib/common";
import { commands, scenes } from "../lib/constants";
import { inspect } from "util";

export type HandlerTuple = [command: string, handler: (ctx: any) => Promise<void>];

export function getOtherCommandHandlers(command: string): HandlerTuple[] {
  return getCommandHandlers().filter(tuple => tuple[0] !== command);
}

export function getCommandHandlers(): HandlerTuple[] {
  return [
    [commands.terms, termsHandler],
    [commands.support, supportHandler],
    [commands.tutorial, tutorialHandler],
    [commands.prompt, promptHandler],
  ];
}

async function termsHandler(ctx: any) {
  await ctx.reply(process.env.TERMS_URL!);
}

async function supportHandler(ctx: any) {
  await ctx.reply(toText([
    "Напишите в техподдержку, чтобы получить ответ на ваш вопрос или обсудить идеи по развитию чат-бота под ваши задачи.",
    process.env.SUPPORT_URL!
  ]));
}

async function tutorialHandler(ctx: any) {
  await ctx.scene.enter(scenes.tutorial);
}

async function promptHandler(ctx: any) {
  await ctx.scene.enter(scenes.prompt);
}

export const kickHandler = async (ctx: any) => {
  const myChatMember = ctx.myChatMember;

  if (myChatMember) {
    if (["kicked", "left"].includes(myChatMember.new_chat_member.status)) {
      ctx.session = {};
    }
  }
}

export const dunnoHandler = async (ctx: any) => {
  if (isDebugMode()) {
    await ctx.reply(inspect(ctx));
  }

  await ctx.reply("Я не понял ваш запрос. Используйте меню диалога. 👆");
}
