import { BaseScene } from "telegraf/scenes";
import { BotContext } from "../botContext";
import { commands, messages, scenes } from "../../lib/constants";
import { addOtherCommandHandlers, dunnoHandler, kickHandler } from "../handlers";
import { clearInlineKeyboard, inlineKeyboard, reply, replyWithKeyboard } from "../../lib/telegram";
import { PaymentEvent } from "../../entities/payment";
import { getOrAddUser } from "../../services/userService";
import { storePayment } from "../../storage/paymentStorage";
import { yooMoneyPayment } from "../../external/yooMoneyPayment";
import { now } from "../../entities/at";
import { Product, getProductDisplayName, isPurchasedProduct, monthlyPremiumSubscription, monthlyUnlimitedSubscription } from "../../entities/product";
import { isError } from "../../lib/error";
import { formatUserSubscription, getCurrentSubscription, getUserPlanSettings } from "../../services/planService";
import { PlanSettings, getPlanSettings } from "../../entities/plan";
import { getMessageLimitDisplayInfo } from "../../services/messageLimitService";
import { canMakePurchases } from "../../services/permissionService";

const scene = new BaseScene<BotContext>(scenes.premium);

const buyPremiumAction = "buy-premium";
const buyUnlimitedAction = "buy-unlimited";
const cancelAction = "cancel";

scene.enter(async (ctx) => {
  if (!ctx.from) {
    await ctx.scene.leave();
    return;
  }

  const user = await getOrAddUser(ctx.from);

  const userPlanSettings = getUserPlanSettings(user);
  const premiumSettings = getPlanSettings("premium");
  const unlimitedSettings = getPlanSettings("unlimited");

  const getLimitText = (planSettings: PlanSettings) => {
    const limit = planSettings.text.dailyMessageLimit;
    const displayInfo = getMessageLimitDisplayInfo(limit);

    return displayInfo.long;
  }

  const planMessages = [
    `Текущий тариф: ${formatUserSubscription(user)}:
◽ модель <b>${userPlanSettings.text.model}</b>
◽ ${getLimitText(userPlanSettings)}`,

    "Если вам нужно больше ежедневных запросов к <b>ChatGPT</b> или вы хотите работать с <b>GPT-4</b>, оформите подписку на один из платных тарифов:",

    `💚 Тариф <b>«Премиум»</b>:
◽ модель <b>${premiumSettings.text.model}</b>
◽ ${getLimitText(premiumSettings)}
◽ 290 рублей на 30 дней`,

    `💛 Тариф <b>«Безлимит»</b>:
◽ модель <b>${unlimitedSettings.text.model}</b>
◽ ${getLimitText(unlimitedSettings)}
◽ 390 рублей на 30 дней`,
  ];

  const buttons: string[][] = [];

  if (!canMakePurchases(user)) {
    planMessages.push("⛔ Покупка тарифов недоступна.");

    await reply(ctx, ...planMessages, messages.backToDialog);
    await ctx.scene.leave();
    return;
  }

  const subscription = getCurrentSubscription(user);

  if (isPurchasedProduct(subscription)) {
    if (subscription.code === "subscription-premium-30-days") {
      buttons.push(
        ["Купить Безлимит", buyUnlimitedAction]
      );

      planMessages.push("⚠ Ваш текущий тариф <b>«Премиум»</b>. Вы можете приобрести <b>«Безлимит»</b>, который заменит текущий тариф <b>без компенсации средств</b>.");
    } else if (subscription.code === "subscription-unlimited-30-days") {
      planMessages.push("⚠ Ваш текущий тариф <b>«Безлимит»</b>. Вы не можете приобрести другие тарифы, пока у вас не закончится текущий.");
    }
  } else {
    buttons.push(
      ["Купить Премиум", buyPremiumAction],
      ["Купить Безлимит", buyUnlimitedAction]
    );
  }

  await replyWithKeyboard(
    ctx,
    inlineKeyboard(...buttons, ["Отмена", cancelAction]),
    ...planMessages
  );
});

addOtherCommandHandlers(scene, commands.premium);

scene.action(buyPremiumAction, async (ctx) => {
  const product = monthlyPremiumSubscription();
  await buyProduct(ctx, product);
});

scene.action(buyUnlimitedAction, async (ctx) => {
  const product = monthlyUnlimitedSubscription();
  await buyProduct(ctx, product);
});

async function buyProduct(ctx: BotContext, product: Product) {
  await clearInlineKeyboard(ctx);

  if (!ctx.from) {
    await ctx.scene.leave();
    return;
  }

  const requestData = {
    total: product.price,
    description: product.name
  };

  const response = await yooMoneyPayment(requestData);

  if (isError(response)) {
    await reply(
      ctx,
      "Произошла ошибка, оплата временно недоступна. Приносим извинения.",
      messages.backToDialog
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

  await storePayment({
    id: paymentId,
    userId: user.id,
    type: "YooMoney",
    cart: [product],
    status: data.status,
    total: requestData.total,
    description: requestData.description,
    url: paymentUrl,
    requestData: requestData,
    responseData: data,
    events: [event]
  });

  await reply(
    ctx,
    `Для оплаты <b>${getProductDisplayName(product, "Gen")}</b> пройдите по ссылке: ${paymentUrl}`,
    `⚠ Время действия ссылки ограничено. Если вы не произведете оплату вовремя, получите новую ссылку с помощью команды /${commands.premium}`,
    "Мы сообщим вам, когда получим оплату.",
    messages.backToDialog
  );

  await ctx.scene.leave();
}

scene.action(cancelAction, async (ctx) => {
  await clearInlineKeyboard(ctx);
  await ctx.scene.leave();
  await reply(ctx, messages.backToDialog);
});

scene.use(kickHandler);
scene.use(dunnoHandler);

export const premiumScene = scene;
