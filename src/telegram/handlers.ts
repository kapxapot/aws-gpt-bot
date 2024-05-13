import { inspect } from "util";
import { Composer } from "telegraf";
import { BotContext } from "./botContext";
import { commands, commonMessages, scenes } from "../lib/constants";
import { clearAndLeave, clearInlineKeyboard, inlineKeyboard, reply, replyWithKeyboard } from "../lib/telegram";
import { historySizeHandler } from "./handlers/historySizeHandler";
import { temperatureHandler } from "./handlers/temperatureHandler";
import { getStatusMessage, getUserOrLeave, showLastHistoryMessage, showStatus } from "../services/messageService";
import { isDebugMode } from "../services/userSettingsService";
import { userHasHistoryMessage } from "../services/userService";
import { remindButton } from "../lib/dialog";

type Handler = (ctx: BotContext) => Promise<void | unknown>;
type HandlerTuple = [command: string, handler: Handler];

export function addOtherCommandHandlers(scene: Composer<BotContext>, exceptCommand: string) {
  getOtherCommandHandlers(exceptCommand).forEach(tuple => {
    const [command, handler] = tuple;

    scene.command(command, async (ctx) => {
      await clearAndLeave(ctx);
      await handler(ctx);
    });
  });

  scene.command(exceptCommand, async (ctx) => {
    await replyWithKeyboard(
      ctx,
      inlineKeyboard(["Покинуть диалог", "leave-dialog"]),
      `Вы уже находитесь в диалоге этой команды. ${commonMessages.useTheKeyboard}`
    );
  });

  scene.action("leave-dialog", backToChatHandler);
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
    [commands.coupons, sceneHandler(scenes.coupons)],
    [commands.historySize, historySizeHandler],
    [commands.temperature, temperatureHandler],
    [commands.chat, backToChatHandler],
    [commands.support, supportHandler],
    [commands.status, statusHandler]
  ];
}

function sceneHandler(scene: string): Handler {
  return async (ctx: BotContext) => await ctx.scene.enter(scene);
}

async function supportHandler(ctx: BotContext) {
  await reply(
    ctx,
    "Заходите в нашу группу задать вопросы, предложить идеи или просто поболтать:",
    process.env.SUPPORT_URL!
  );
}

async function statusHandler(ctx: BotContext) {
  const user = await getUserOrLeave(ctx);

  if (!user) {
    return;
  }

  await showStatus(ctx, user);
}

export async function kickHandler(ctx: BotContext, next: () => Promise<void>) {
  const myChatMember = ctx.myChatMember;

  if (myChatMember) {
    if (["kicked", "left"].includes(myChatMember.new_chat_member.status)) {
      ctx.session = {};
      return;
    }
  }

  await next();
}

export async function dunnoHandler(ctx: BotContext) {
  const user = await getUserOrLeave(ctx);

  if (isDebugMode(user)) {
    console.log(inspect(ctx));
  }

  await reply(ctx, `Я не понял ваш запрос. ${commonMessages.useTheKeyboard}`);
}

/**
 * 1. Clears the inline keyboard.
 * 2. Leaves the scene.
 * 3. Shows `backToChat` message with a button to replay last message (if there is one).
 */
export async function backToChatHandler(ctx: BotContext) {
  await clearAndLeave(ctx);

  const user = await getUserOrLeave(ctx);

  if (!user) {
    return;
  }

  const remindKeyboard = userHasHistoryMessage(user)
    ? inlineKeyboard(remindButton)
    : null;

  await replyWithKeyboard(
    ctx,
    remindKeyboard,
    commonMessages.backToChat,
    getStatusMessage(user)
  );
}

export async function remindHandler(ctx: BotContext) {
  await clearInlineKeyboard(ctx);

  const user = await getUserOrLeave(ctx);

  if (!user) {
    return;
  }

  await showLastHistoryMessage(ctx, user, "Похоже, разговор только начался. В истории пусто.");
}
