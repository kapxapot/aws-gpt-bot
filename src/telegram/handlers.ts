import { toText } from "../lib/common";
import { commands, scenes } from "../lib/constants";

export type HandlerTuple = [command: string, handler: (ctx: any) => any];

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

function termsHandler(ctx: any) {
  return ctx.reply(process.env.TERMS_URL!);
}

function supportHandler(ctx: any) {
  return ctx.reply(toText([
    "Напишите в техподдержку, чтобы получить ответ на ваш вопрос или обсудить идеи по развитию чат-бота под ваши задачи.",
    process.env.SUPPORT_URL!
  ]));
}

function tutorialHandler(ctx: any) {
  return ctx.scene.enter(scenes.tutorial);
}

function promptHandler(ctx: any) {
  return ctx.scene.enter(scenes.prompt);
}
