import { BaseScene } from "telegraf/scenes";
import { BotContext } from "../context";
import { commands, messages, scenes } from "../../lib/constants";
import { addOtherCommandHandlers, dunnoHandler, kickHandler } from "../handlers";
import { clearInlineKeyboard, inlineKeyboard, reply } from "../../lib/telegram";
import { PaymentEvent, PaymentType } from "../../entities/payment";
import { getOrAddUser } from "../../services/userService";
import { storePayment } from "../../storage/payments";
import { yooMoneyPayment } from "../../external/yooMoneyPayment";
import { now } from "../../entities/at";
import { monthlyPremiumSubscription } from "../../entities/product";
import { isError } from "../../lib/error";

const scene = new BaseScene<BotContext>(scenes.premium);

const payAction = "pay";
const noPayAction = "no_pay";

scene.enter(async (ctx) => {
  await ctx.reply(
    "Здесь вы можете дать нам денег. 💰 Мы очень рады вашему душевному порыву. 😊",
    inlineKeyboard(
      ["Дать денег 😍", payAction],
      ["Не дать денег ☹", noPayAction]
    )
  );
});

addOtherCommandHandlers(scene, commands.premium);

scene.action(payAction, async (ctx) => {
  await clearInlineKeyboard(ctx);

  if (!ctx.from) {
    await ctx.scene.leave();
    return;
  }

  const product = monthlyPremiumSubscription();

  const requestData = {
    total: product.price,
    description: product.name
  };

  const response = await yooMoneyPayment(requestData);

  if (isError(response)) {
    await reply(
      ctx,
      "Произошла ошибка, оплата временно недоступна. Приносим извинения.",
      messages.backToAI
    );

    await ctx.scene.leave();

    return;
  }

  const data = response.data;

  const event: PaymentEvent = {
    type: "created",
    details: data,
    at: now()
  };

  const paymentId = data.id;
  const paymentUrl = data.confirmation.confirmation_url;

  const user = await getOrAddUser(ctx.from);

  const paymentData = {
    id: paymentId,
    userId: user.id,
    type: PaymentType.YooMoney,
    cart: [product],
    status: data.status,
    total: requestData.total,
    description: requestData.description,
    url: paymentUrl,
    requestData: requestData,
    responseData: data,
    events: [event]
  };

  await storePayment(paymentData);

  await reply(
    ctx,
    `Для оплаты пройдите по ссылке: ${paymentUrl}`,
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
