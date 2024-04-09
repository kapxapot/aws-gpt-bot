import { BaseScene } from "telegraf/scenes";
import { AnyContext, BotContext } from "../botContext";
import { commands, scenes } from "../../lib/constants";
import { addOtherCommandHandlers, backToMainDialogHandler, dunnoHandler, kickHandler } from "../handlers";
import { clearInlineKeyboard, contactKeyboard, contactRequestLabel, emptyKeyboard, inlineKeyboard, reply, replyBackToMainDialog, replyWithKeyboard } from "../../lib/telegram";
import { PaymentEvent } from "../../entities/payment";
import { storePayment } from "../../storage/paymentStorage";
import { yooMoneyPayment } from "../../external/yooMoneyPayment";
import { now } from "../../entities/at";
import { Product, ProductCode, productCodes } from "../../entities/product";
import { isError } from "../../lib/error";
import { getSubscriptionPlan } from "../../services/subscriptionService";
import { canMakePurchases, canPurchaseProduct } from "../../services/permissionService";
import { cancelAction, cancelButton } from "../../lib/dialog";
import { getUserOrLeave } from "../../services/messageService";
import { getUserPlan } from "../../services/userService";
import { SessionData } from "../session";
import { phoneToItu, toText } from "../../lib/common";
import { message } from "telegraf/filters";
import { updateUser } from "../../storage/userStorage";
import { getProductByCode, getProductDisplayName, getProductFullDisplayName } from "../../services/productService";
import { User } from "../../entities/user";
import { getPlanDescription } from "../../services/planService";

const scene = new BaseScene<BotContext>(scenes.premium);

scene.enter(async ctx => {
  const user = await getUserOrLeave(ctx);

  if (!user) {
    return;
  }

  const plan = getUserPlan(user);
  const purchasableProducts = getPurchasableProducts(user);

  const messages = [
    `Текущий тариф:`,
    getPlanDescription(plan)
  ];

  const buttons: string[][] = [];

  if (!purchasableProducts.length) {
    messages.push("На данный момент других тарифов нет.");
  } else {
    messages.push(
      `Если вам нужно больше запросов к <b>ChatGPT</b> и <b>DALL-E</b> или вы хотите работать с <b>GPT-4</b>, приобретите один из платных пакетов:`
    );

    for (const product of purchasableProducts) {
      const productPlan = getSubscriptionPlan(product);

      messages.push(getPlanDescription(productPlan));
      buttons.push([
        `Купить ${getProductDisplayName(product)}`,
        getProductBuyAction(product.code)
      ]);
    }
  }

  if (!canMakePurchases(user)) {
    await replyBackToMainDialog(
      ctx,
      ...messages,
      "⛔ Покупка тарифов недоступна."
    );

    return;
  }

  await replyWithKeyboard(
    ctx,
    inlineKeyboard(...buttons, cancelButton),
    ...messages
  );
});

addOtherCommandHandlers(scene, commands.premium);

for (const productCode of productCodes) {
  scene.action(
    getProductBuyAction(productCode),
    async ctx => await buyAction(ctx, productCode)
  );
}

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
      `Нажмите кнопку "${contactRequestLabel}" (Telegram отправит его автоматически).`,
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

function getPurchasableProducts(user: User): Product[] {
  return productCodes
    .filter(code => canPurchaseProduct(user, code))
    .map(code => getProductByCode(code));
}

function getProductBuyAction(code: ProductCode): string {
  return `buy-${code}`;
}
