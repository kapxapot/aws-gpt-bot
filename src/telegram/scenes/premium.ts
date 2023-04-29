import { BaseScene } from "telegraf/scenes";
import { BotContext } from "../context";
import { commands, messages, scenes } from "../../lib/constants";
import { dunnoHandler, getOtherCommandHandlers, kickHandler } from "../handlers";
import { clearInlineKeyboard, reply } from "../../lib/telegram";
import { Markup } from "telegraf";

const scene = new BaseScene<BotContext>(scenes.premium);

const payAction = "pay";
const noPayAction = "no_pay";

scene.enter(async (ctx) => {
  await ctx.reply(
    "Здесь вы можете дать нам денег. 💰 Мы очень рады вашему душевному порыву. 😊",
    Markup.inlineKeyboard([
      Markup.button.callback("Дать денег 😍", payAction),
      Markup.button.callback("Не дать денег ☹", noPayAction)
    ])
  );
});

getOtherCommandHandlers(commands.prompt).forEach(tuple => {
  scene.command(tuple[0], async (ctx) => {
    await clearInlineKeyboard(ctx);
    await ctx.scene.leave();
    await tuple[1](ctx);
  });
});

scene.action(payAction, async (ctx) => {
  await clearInlineKeyboard(ctx);

  await reply(
    ctx,
    "Для оплаты пройдите по ссылке: ССЫЛКА",
    `⚠ Время действия ссылки ограничено. Если вы не произведете оплату вовремя, получите новую ссылку с помощью команды /${commands.premium}`,
    "Мы сообщим вам, когда получим оплату.",
    messages.backToAI
  );

  await ctx.scene.leave();
});

scene.action(noPayAction, async (ctx) => {
  await clearInlineKeyboard(ctx);

  await reply(
    ctx,
    "Жадина-говядина!",
    messages.backToAI
  );

  await ctx.scene.leave();
});

scene.use(async ctx => {
  await kickHandler(ctx);
  await dunnoHandler(ctx);
});

export const premiumScene = scene;
