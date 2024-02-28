import { inspect } from "util";
import { Composer } from "telegraf";
import { AnyContext, BotContext } from "./botContext";
import { commands, commonMessages, scenes } from "../lib/constants";
import { clearAndLeave, clearInlineKeyboard, inlineKeyboard, reply, replyWithKeyboard } from "../lib/telegram";
import { historySizeHandler } from "./handlers/historySizeHandler";
import { temperatureHandler } from "./handlers/temperatureHandler";
import { getLastHistoryMessage, getOrAddUser } from "../services/userService";
import { showLastHistoryMessage, showStatus } from "../services/messageService";
import { isDebugMode } from "../services/userSettingsService";
import { remindButton } from "../lib/dialog";
import { getModeName } from "../entities/prompt";
import { User } from "../entities/user";

type Handler = (ctx: AnyContext) => Promise<void>;
type HandlerTuple = [command: string, handler: Handler];

export function addOtherCommandHandlers(scene: Composer<BotContext>, exceptCommand: string) {
  getOtherCommandHandlers(exceptCommand).forEach(tuple => {
    scene.command(tuple[0], async (ctx) => {
      await clearAndLeave(ctx);
      await tuple[1](ctx);
    });
  });

  scene.command(exceptCommand, async (ctx) => {
    await replyWithKeyboard(
      ctx,
      inlineKeyboard(["Покинуть диалог", "leave-dialog"]),
      `Вы уже находитесь в диалоге этой команды. ${commonMessages.useTheKeyboard}`
    );
  });

  scene.action("leave-dialog", backToMainDialogHandler);
}

function getOtherCommandHandlers(command: string): HandlerTuple[] {
  return getCommandHandlers().filter(tuple => tuple[0] !== command);
}

export function getCommandHandlers(): HandlerTuple[] {
  return [
    [commands.tutorial, sceneHandler(scenes.tutorial)],
    [commands.mode, sceneHandler(scenes.mode)],
    [commands.premium, sceneHandler(scenes.premium)],
    [commands.image, sceneHandler(scenes.image)],
    [commands.terms, termsHandler],
    [commands.support, supportHandler],
    [commands.historySize, historySizeHandler],
    [commands.temperature, temperatureHandler],
    [commands.status, statusHandler],
  ];
}

function sceneHandler(scene: string): Handler {
  return async (ctx: AnyContext) => await ctx.scene.enter(scene);
}

async function termsHandler(ctx: AnyContext) {
  await reply(ctx, process.env.TERMS_URL!);
}

async function supportHandler(ctx: AnyContext) {
  await reply(
    ctx,
    "Напишите в техподдержку, чтобы получить ответ на ваш вопрос или обсудить идеи по развитию чат-бота под ваши задачи.",
    process.env.SUPPORT_URL!
  );
}

async function statusHandler(ctx: AnyContext) {
  if (!ctx.from) {
    return;
  }

  const user = await getOrAddUser(ctx.from);

  await showStatus(ctx, user);
}

export async function kickHandler(ctx: AnyContext, next: () => Promise<void>) {
  const myChatMember = ctx.myChatMember;

  if (myChatMember) {
    if (["kicked", "left"].includes(myChatMember.new_chat_member.status)) {
      ctx.session = {};
      return;
    }
  }

  await next();
}

export async function dunnoHandler(ctx: AnyContext) {
  if (ctx.from) {
    const user = await getOrAddUser(ctx.from);

    if (isDebugMode(user)) {
      console.log(inspect(ctx));
    }
  }

  await reply(ctx, `Я не понял ваш запрос. ${commonMessages.useTheKeyboard}`);
}

/**
 * 1. Clears the inline keyboard.
 * 2. Leaves the scene.
 * 3. Shows "backToMainDialog" message with a button to replay last message (if there is one).
 */
export async function backToMainDialogHandler(ctx: AnyContext) {
  await clearAndLeave(ctx);

  if (!ctx.from) {
    return;
  }

  const user = await getOrAddUser(ctx.from);

  const hasMessage = await userHasMessage(user);
  const buttons = hasMessage ? [remindButton] : []

  await replyWithKeyboard(
    ctx,
    inlineKeyboard(...buttons),
    commonMessages.backToMainDialog,
    `Режим: <b>${getModeName(user)}</b>`
  );
}

async function userHasMessage(user: User): Promise<boolean> {
  const message = getLastHistoryMessage(user);

  return !!message;
}

export async function remindHandler(ctx: AnyContext) {
  await clearInlineKeyboard(ctx);

  if (!ctx.from) {
    return;
  }

  const user = await getOrAddUser(ctx.from);

  await showLastHistoryMessage(ctx, user, "Похоже, разговор только начался. В истории пусто.");
}
