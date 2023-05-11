import { inspect } from "util";
import { Composer } from "telegraf";
import { BotContext } from "./botContext";
import { commands, messages, scenes } from "../lib/constants";
import { clearInlineKeyboard, reply } from "../lib/telegram";
import { historySizeHandler } from "./handlers/historySizeHandler";
import { temperatureHandler } from "./handlers/temperatureHandler";
import { isDebugMode } from "../lib/common";
import { getOrAddUser } from "../services/userService";

type Handler = (ctx: any) => Promise<void>;
type HandlerTuple = [command: string, handler: Handler];

export function addOtherCommandHandlers(scene: Composer<BotContext>, exceptCommand: string) {
  getOtherCommandHandlers(exceptCommand).forEach(tuple => {
    scene.command(tuple[0], async (ctx) => {
      await clearInlineKeyboard(ctx);
      await ctx.scene.leave();
      await tuple[1](ctx);
    });
  });

  scene.command(exceptCommand, async (ctx) => {
    await reply(
      ctx,
      `Вы уже находитесь в диалоге этой команды. ${messages.useTheKeyboard}`
    );
  });
}

function getOtherCommandHandlers(command: string): HandlerTuple[] {
  return getCommandHandlers().filter(tuple => tuple[0] !== command);
}

export function getCommandHandlers(): HandlerTuple[] {
  return [
    [commands.terms, termsHandler],
    [commands.support, supportHandler],
    [commands.tutorial, sceneHandler(scenes.tutorial)],
    [commands.prompt, sceneHandler(scenes.prompt)],
    [commands.premium, sceneHandler(scenes.premium)],
    [commands.historySize, historySizeHandler],
    [commands.temperature, temperatureHandler],
    [commands.mode, sceneHandler(scenes.mode)],
  ];
}

function sceneHandler(scene: string): Handler {
  return async (ctx: any) => await ctx.scene.enter(scene);
}

async function termsHandler(ctx: any) {
  await reply(ctx, process.env.TERMS_URL!);
}

async function supportHandler(ctx: any) {
  await reply(
    ctx,
    "Напишите в техподдержку, чтобы получить ответ на ваш вопрос или обсудить идеи по развитию чат-бота под ваши задачи.",
    process.env.SUPPORT_URL!
  );
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
  if (ctx.from) {
    const user = await getOrAddUser(ctx.from);

    if (isDebugMode(user)) {
      console.log(inspect(ctx));
    }
  }

  await reply(ctx, `Я не понял ваш запрос. ${messages.useTheKeyboard}`);
}
