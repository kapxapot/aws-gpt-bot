import { BaseScene } from "telegraf/scenes";
import { AnyContext, BotContext } from "../botContext";
import { commands, scenes } from "../../lib/constants";
import { addOtherCommandHandlers, backToMainDialogHandler, dunnoHandler, kickHandler } from "../handlers";
import { clearInlineKeyboard, contactKeyboard, emptyKeyboard, inlineKeyboard, reply, replyBackToMainDialog, replyWithKeyboard } from "../../lib/telegram";
import { PaymentEvent } from "../../entities/payment";
import { storePayment } from "../../storage/paymentStorage";
import { yooMoneyPayment } from "../../external/yooMoneyPayment";
import { now } from "../../entities/at";
import { ProductCode } from "../../entities/product";
import { isError } from "../../lib/error";
import { formatSubscription, getCurrentSubscription } from "../../services/subscriptionService";
import { canMakePurchases, canPurchaseProduct } from "../../services/permissionService";
import { cancelAction, cancelButton } from "../../lib/dialog";
import { getUserOrLeave } from "../../services/messageService";
import { getUserPlan, getUserPlanSettings } from "../../services/userService";
import { getPlanSettings, getPlanSettingsGptModel, getPlanSettingsLimitText } from "../../services/planSettingsService";
import { SessionData } from "../session";
import { phoneToItu, toText } from "../../lib/common";
import { message } from "telegraf/filters";
import { updateUser } from "../../storage/userStorage";
import { getProductByCode, getProductFullDisplayName, getProductTypeDisplayName } from "../../services/productService";

const scene = new BaseScene<BotContext>(scenes.premium);

const buyPremiumAction = "buy-premium";

scene.enter(async ctx => {
  const user = await getUserOrLeave(ctx);

  if (!user) {
    return;
  }

  // get plan messages
  const userPlanSettings = getUserPlanSettings(user);
  const userGptModel = getPlanSettingsGptModel(userPlanSettings);

  const premiumSettings = getPlanSettings("premium");
  const premiumGptModel = getPlanSettingsGptModel(premiumSettings);
  const premiumActive = premiumSettings.active;

  const subscription = getCurrentSubscription(user);

  const messages = [
    `Текущий ${getProductTypeDisplayName(subscription)}:`,
    `${formatSubscription(subscription)}:
◽ модель <b>${userGptModel}</b>
◽ ${getPlanSettingsLimitText(userPlanSettings, userGptModel, "day")}`
  ];

  if (premiumActive) {
    messages.push(
      "Если вам нужно больше ежедневных запросов к <b>ChatGPT</b> или вы хотите работать с <b>GPT-4</b>, оформите подписку на один из платных тарифов:"
    );

    if (premiumActive) {
      messages.push(
        `💚 Тариф <b>«Премиум»</b>:
◽ модель <b>${premiumGptModel}</b>
◽ ${getPlanSettingsLimitText(premiumSettings, premiumGptModel, "day")}
◽ 290 рублей на 30 дней`
      );
    }
  } else {
    messages.push("На данный момент других тарифов нет.");
  }

  const buttons: string[][] = [];

  if (!canMakePurchases(user)) {
    await replyBackToMainDialog(
      ctx,
      ...messages,
      "⛔ Покупка тарифов недоступна."
    );

    return;
  }

  const plan = getUserPlan(user);

  switch (plan) {
    case "free":
      if (premiumActive) {
        buttons.push(["Купить Премиум", buyPremiumAction]);
      }

      break;

    case "premium":
      messages.push("⚠ Ваш текущий тариф <b>«Премиум»</b>. Вы не можете приобрести другие тарифы, пока у вас не закончится текущий.");

      break;
  }

  await replyWithKeyboard(
    ctx,
    inlineKeyboard(...buttons, cancelButton),
    ...messages
  );
});

addOtherCommandHandlers(scene, commands.premium);

scene.action(
  buyPremiumAction,
  async ctx => await buyAction(ctx, "subscription-premium-30-days")
);

async function buyAction(ctx: AnyContext, productCode: ProductCode) {
  await clearInlineKeyboard(ctx);

  const user = await getUserOrLeave(ctx);

  if (!user) {
    return;
  }

  if (user.phoneNumber) {
    await buyProduct(ctx, productCode);
    return;
  }

  // ask for phone number and then buy the product
  setTargetProductCode(ctx.session, productCode);
  await askForPhone(ctx);
}

async function askForPhone(ctx: AnyContext) {
  await ctx.reply(
    toText(
      "📱 Пожалуйста, предоставьте номер вашего телефона.",
      "Это нужно для автоматической отправки чеков.",
      "👇"
    ),
    contactKeyboard()
  );
}

scene.on(message("contact"), async ctx => {
  const contact = ctx.message.contact.phone_number;
  const formattedPhone = phoneToItu(contact);

  if (!formattedPhone) {
    await ctx.reply(
      toText(
        "📱 Неверный формат телефона. Попробуйте еще раз.",
        "👇"
      ),
      contactKeyboard()
    );

    return;
  }

  let user = await getUserOrLeave(ctx);

  if (!user) {
    await ctx.reply(
      "Пользователь не найден.",
      emptyKeyboard()
    );

    return;
  }

  user = await updateUser(user, { phoneNumber: contact });

  await ctx.reply(
    "Я записал ваш телефон, спасибо! 🙏",
    emptyKeyboard()
  );

  const targetProductCode = getTargetProductCode(ctx.session);

  if (!targetProductCode || !canPurchaseProduct(user, targetProductCode)) {
    await reply(ctx, "Выбранный вами продукт более не доступен.");
    backToMainDialogHandler(ctx);

    return;
  }

  await buyProduct(ctx, targetProductCode);
});

async function buyProduct(ctx: BotContext, productCode: ProductCode) {
  const user = await getUserOrLeave(ctx);

  if (!user) {
    return;
  }

  const product = getProductByCode(productCode);

  const requestData = {
    user,
    total: product.price,
    description: product.name
  };

  const response = await yooMoneyPayment(requestData);

  if (isError(response)) {
    await replyBackToMainDialog(
      ctx,
      "Произошла ошибка, оплата временно недоступна. Приносим извинения."
    );

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

  await replyBackToMainDialog(
    ctx,
    `💳 Для оплаты ${getProductFullDisplayName(product, "Genitive")} пройдите по ссылке:`,
    paymentUrl,
    `⚠ Время действия ссылки ограничено. Если вы не успеете оплатить счет, вы можете получить новую ссылку с помощью команды /${commands.premium}`,
    "Мы сообщим вам, когда получим оплату."
  );
}

scene.action(cancelAction, backToMainDialogHandler);

scene.use(kickHandler);
scene.use(dunnoHandler);

export const premiumScene = scene;

function setTargetProductCode(session: SessionData, targetProductCode: ProductCode) {
  session.premiumData = {
    ...session.premiumData ?? {},
    targetProductCode
  };
}

function getTargetProductCode(session: SessionData): ProductCode | null {
  return session.premiumData?.targetProductCode ?? null;
}
