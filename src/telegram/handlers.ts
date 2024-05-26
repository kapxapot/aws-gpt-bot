import { inspect } from "util";
import { Composer } from "telegraf";
import { BotContext } from "./botContext";
import { commands, commonMessages, scenes, symbols } from "../lib/constants";
import { clearAndLeave, clearInlineKeyboard, inlineKeyboard, reply, replyWithKeyboard } from "../lib/telegram";
import { historySizeHandler } from "./handlers/historySizeHandler";
import { temperatureHandler } from "./handlers/temperatureHandler";
import { getStatusMessage, showLastHistoryMessage, showStatus, withUser } from "../services/messageService";
import { isDebugMode } from "../services/userSettingsService";
import { getUserActiveProducts, getUserInviteLink, userHasHistoryMessage } from "../services/userService";
import { remindButton } from "../lib/dialog";
import { getCouponTemplateByCode } from "../services/couponService";
import { formatProductDescriptions, formatProductName, getProductByCode } from "../services/productService";
import { isEmpty } from "../lib/common";

type Handler = (ctx: BotContext) => Promise<void | unknown>;
type HandlerTuple = [command: string, handler: Handler];

export function addSceneCommandHandlers(scene: Composer<BotContext>) {
  getCommandHandlers()
    .forEach(tuple => {
      const [command, handler] = tuple;

      scene.command(command, async (ctx) => {
        await clearAndLeave(ctx);
        await handler(ctx);
      });
    });
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
    [commands.status, statusHandler],
    [commands.invite, inviteHandler],
    [commands.products, productsHandler]
  ];
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
  await withUser(ctx, async user => {
    if (isDebugMode(user)) {
      console.log(inspect(ctx));
    }
  });

  await reply(ctx, `Я не понял ваш запрос. ${commonMessages.useTheKeyboard}`);
}

/**
 * 1. Clears the inline keyboard.
 * 2. Leaves the scene.
 * 3. Shows `backToChat` message with a button to replay last message (if there is one).
 */
export async function backToChatHandler(ctx: BotContext) {
  await clearAndLeave(ctx);

  await withUser(ctx, async user => {
    const remindKeyboard = userHasHistoryMessage(user)
      ? inlineKeyboard(remindButton)
      : null;

    await replyWithKeyboard(
      ctx,
      remindKeyboard,
      commonMessages.backToChat,
      getStatusMessage(user)
    );
  });
}

export async function remindHandler(ctx: BotContext) {
  await clearInlineKeyboard(ctx);

  await withUser(ctx, async user => {
    await showLastHistoryMessage(
      ctx,
      user,
      "Похоже, разговор только начался. В истории пусто."
    );
  });
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
  await withUser(ctx, async user => {
    await showStatus(ctx, user);
  });
}

async function inviteHandler(ctx: BotContext) {
  await withUser(ctx, async user => {
    const couponTemplate = getCouponTemplateByCode("invite");
    const product = getProductByCode(couponTemplate.productCode);

    await reply(
      ctx,
      `Пригласите друзей в бот и получите купон на активацию ${formatProductName(product, "Genitive")} в подарок! 🎁`,
      `Поделитесь с друзьями этой ссылкой: ${getUserInviteLink(user)}`
    );
  });
}

async function productsHandler(ctx: BotContext) {
  await withUser(ctx, async user => {
    const products = getUserActiveProducts(user);

    if (isEmpty(products)) {
      await reply(
        ctx,
        "У вас нет активных продуктов.",
        `${symbols.card} Приобрести: /${commands.premium}`
      );
    } else {
      await reply(
        ctx,
        formatProductDescriptions(
          products,
          {
            showExpiration: true,
            showConsumption: true
          }
        ),
        `${symbols.card} Приобрести еще: /${commands.premium}`
      );
    }
  });
}
