import { BaseScene } from "telegraf/scenes";
import { AnyContext, BotContext } from "../botContext";
import { commands, scenes, symbols } from "../../lib/constants";
import { addOtherCommandHandlers, backToMainDialogHandler, dunnoHandler, kickHandler } from "../handlers";
import { ButtonLike, clearInlineKeyboard, contactKeyboard, contactRequestLabel, emptyKeyboard, inlineKeyboard, reply, replyBackToMainDialog, replyWithKeyboard } from "../../lib/telegram";
import { Product, ProductCode, freeSubscription, productCodes } from "../../entities/product";
import { isError } from "../../lib/error";
import { getSubscriptionFullDisplayName, getSubscriptionPlan, getSubscriptionShortName } from "../../services/subscriptionService";
import { canMakePurchases, canPurchaseProduct } from "../../services/permissionService";
import { cancelAction, cancelButton } from "../../lib/dialog";
import { getUserOrLeave } from "../../services/messageService";
import { SessionData } from "../session";
import { orJoin, phoneToItu, toCompactText, toText } from "../../lib/common";
import { message } from "telegraf/filters";
import { updateUser } from "../../storage/userStorage";
import { getActiveProducts, getProductByCode, gpt3Products, gptokenProducts } from "../../services/productService";
import { User } from "../../entities/user";
import { getPlanDescription } from "../../services/planService";
import { gptokenString } from "../../services/gptokenService";
import { bulletize } from "../../lib/text";
import { createPayment } from "../../services/paymentService";
import { Markup } from "telegraf";

type Message = string;

type MessagesAndButtons = {
  messages: Message[];
  buttons: ButtonLike[];
};

type ProductGroup = {
  code: "gpt3" | "gptoken";
  name: string;
  products: Product[];
  marketingMessage: string;
  description: string;
};

const productGroups: ProductGroup[] = [
  {
    code: "gpt3",
    name: "GPT-3.5",
    products: gpt3Products,
    marketingMessage: "вам нужно больше запросов к <b>GPT-3.5</b>",
    description: "Пакеты запросов к модели <b>GPT-3.5</b>"
  },
  {
    code: "gptoken",
    name: "GPT-4 / DALL-E",
    products: gptokenProducts,
    marketingMessage: "вы хотите работать с <b>GPT-4</b> и <b>DALL-E</b>",
    description: toText(
      `Пакеты ${symbols.gptoken} гптокенов для работы с <b>GPT-4</b> и <b>DALL-E</b>`,
      toCompactText(
        ...bulletize(
          `1 запрос к <b>GPT-4</b> = ${gptokenString(1)}`,
          `1 картинка <b>DALL-E 3</b> = от ${gptokenString(2, "Genitive")}`
        )
      )
    )
  }
];

const backToStartAction = "backToStart";
const getProductBuyAction = (code: ProductCode) => `buy-${code}`;
const getGroupAction = (group: ProductGroup) => `group-${group.code}`;

const scene = new BaseScene<BotContext>(scenes.premium);

scene.enter(mainHandler);

async function mainHandler(ctx: BotContext) {
  const user = await getUserOrLeave(ctx);

  if (!user) {
    return;
  }

  const validProductGroups = filteredProductGroups(user);
  const productCount = validProductGroups.reduce((sum, group) => sum + group.products.length, 0);

  const subscriptions = [
    ...getActiveProducts(user),
    freeSubscription
  ];

  const messages = [
    "Ваши продукты:",
    ...subscriptions
      .map(subscription => getSubscriptionPlan(subscription))
      .map(plan => getPlanDescription(plan, "shortest"))
  ];

  if (!productCount) {
    messages.push("На данный момент доступных пакетов нет.");

    if (!canMakePurchases(user)) {
      await replyBackToMainDialog(
        ctx,
        ...messages,
        "⛔ Покупки недоступны."
      );
    }

    return;
  }

  const marketingMessages = validProductGroups.map(group => group.marketingMessage);

  messages.push(
    `Если ${orJoin(...marketingMessages)}, приобретите один из пакетов услуг.`
  );

  await replyWithKeyboard(
    ctx,
    inlineKeyboard(
      ...validProductGroups.map(group => productGroupButton(group)),
      cancelButton
    ),
    ...messages
  );
}

addOtherCommandHandlers(scene, commands.premium);

for (const productCode of productCodes) {
  scene.action(
    getProductBuyAction(productCode),
    async ctx => await buyAction(ctx, productCode)
  );
}

for (const group of productGroups) {
  scene.action(
    getGroupAction(group),
    async ctx => await groupAction(ctx, group)
  );
}

async function groupAction(ctx: AnyContext, group: ProductGroup) {
  await clearInlineKeyboard(ctx);
  const user = await getUserOrLeave(ctx);

  if (!user) {
    return;
  }

  const filteredGroup = filterProductGroup(user, group);

  const { messages, buttons } = listProducts(filteredGroup.products);

  await replyWithKeyboard(
    ctx,
    inlineKeyboard(
      ...buttons,
      ["Назад", backToStartAction],
      cancelButton
    ),
    group.description,
    ...messages
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
  await clearInlineKeyboard(ctx);

  const user = await getUserOrLeave(ctx);

  if (!user) {
    return;
  }

  const product = getProductByCode(productCode);
  const payment = await createPayment(user, product);

  if (isError(payment)) {
    await replyBackToMainDialog(
      ctx,
      "Произошла ошибка, оплата временно недоступна. Приносим извинения."
    );

    return;
  }

  await replyWithKeyboard(
    ctx,
    inlineKeyboard(
      Markup.button.url("Оплатить", payment.url),
      ["Купить еще", backToStartAction],
      cancelButton
    ),
    `💳 Для оплаты ${getSubscriptionFullDisplayName(product, "Genitive")} <a href="${payment.url}">пройдите по ссылке</a>.`,
    `⚠ Время действия ссылки ограничено. Если вы не успеете оплатить счет, вы можете получить новую ссылку с помощью команды /${commands.premium}`,
    "Мы сообщим вам, когда получим оплату."
  );
}

scene.action(backToStartAction, async ctx => {
  await clearInlineKeyboard(ctx);
  await mainHandler(ctx);
});

scene.action(cancelAction, backToMainDialogHandler);
scene.on(message("text"), backToMainDialogHandler);

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

function filterPurchasable(user: User, products: Product[]): Product[] {
  return products
    .filter(product => canPurchaseProduct(user, product.code));
}

function listProducts(products: Product[]): MessagesAndButtons {
  const messages: Message[] = [];
  const buttons: ButtonLike[] = [];

  for (const product of products) {
    const productPlan = getSubscriptionPlan(product);

    messages.push(getPlanDescription(productPlan, "short"));
    buttons.push(productButton(product));
  }

  return { messages, buttons };
}

const productButton = (product: Product): ButtonLike => [
  `Купить ${getSubscriptionShortName(product)}`,
  getProductBuyAction(product.code)
];

const productGroupButton = (group: ProductGroup): ButtonLike => [
  `Пакеты ${group.name}`,
  getGroupAction(group)
];

function filteredProductGroups(user: User): ProductGroup[] {
  return productGroups
    .map(group => filterProductGroup(user, group))
    .filter(group => group.products.length > 0);
}

function filterProductGroup(user: User, group: ProductGroup): ProductGroup {
  return {
    ...group,
    products: filterPurchasable(user, group.products)
  };
}
