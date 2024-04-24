import { BaseScene } from "telegraf/scenes";
import { AnyContext, BotContext } from "../botContext";
import { commands, scenes } from "../../lib/constants";
import { addOtherCommandHandlers, backToMainDialogHandler, dunnoHandler, kickHandler } from "../handlers";
import { ButtonLike, clearInlineKeyboard, contactKeyboard, contactRequestLabel, emptyKeyboard, inlineKeyboard, reply, replyBackToMainDialog, replyWithKeyboard } from "../../lib/telegram";
import { PaymentEvent } from "../../entities/payment";
import { storePayment } from "../../storage/paymentStorage";
import { yooMoneyPayment } from "../../external/yooMoneyPayment";
import { now } from "../../entities/at";
import { Product, ProductCode, productCodes } from "../../entities/product";
import { isError } from "../../lib/error";
import { getCurrentSubscription, getSubscriptionPlan } from "../../services/subscriptionService";
import { canMakePurchases, canPurchaseProduct } from "../../services/permissionService";
import { cancelAction, cancelButton } from "../../lib/dialog";
import { getUserOrLeave } from "../../services/messageService";
import { SessionData } from "../session";
import { orJoin, phoneToItu, toText } from "../../lib/common";
import { message } from "telegraf/filters";
import { updateUser } from "../../storage/userStorage";
import { getProductByCode, getProductFullDisplayName, getProductShortName, getProductTypeDisplayName, gpt3Products, gptokenProducts } from "../../services/productService";
import { User } from "../../entities/user";
import { getPlanDescription } from "../../services/planService";

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
};

const productGroups: ProductGroup[] = [
  {
    code: "gpt3",
    name: "GPT-3.5",
    products: gpt3Products,
    marketingMessage: "вам нужно больше запросов к <b>GPT-3.5</b>"
  },
  {
    code: "gptoken",
    name: "GPT-4 / DALL-E",
    products: gptokenProducts,
    marketingMessage: "вы хотите работать с <b>GPT-4</b> и <b>DALL-E</b>"
  }
];

const getProductBuyAction = (code: ProductCode) => `buy-${code}`;
const getGroupAction = (group: ProductGroup) => `group-${group.code}`; 

const scene = new BaseScene<BotContext>(scenes.premium);

scene.enter(async ctx => {
  const user = await getUserOrLeave(ctx);

  if (!user) {
    return;
  }

  const subscription = getCurrentSubscription(user);
  const plan = getSubscriptionPlan(subscription);

  const productGroups: ProductGroup[] = [
    {
      code: "gpt3",
      name: "GPT-3.5",
      products: filterPurchasable(user, gpt3Products),
      marketingMessage: "вам нужно больше запросов к <b>GPT-3.5</b>"
    },
    {
      code: "gptoken",
      name: "GPT-4 / DALL-E",
      products: filterPurchasable(user, gptokenProducts),
      marketingMessage: "вы хотите работать с <b>GPT-4</b> и <b>DALL-E</b>"
    }
  ];

  const validProductGroups = filteredProductGroups(user);
  const productCount = productGroups.reduce((sum, group) => sum + group.products.length, 0);

  const messages = [
    `Ваш текущий ${getProductTypeDisplayName(subscription)}:`,
    getPlanDescription(plan)
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
      ...validProductGroups.map(
        group => [getGroupAction(group), `Пакеты ${group.name}`] as ButtonLike
      ),
      cancelButton
    ),
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

for (const group of productGroups) {
  scene.action(
    getGroupAction(group),
    async ctx => await groupAction(ctx, group)
  );
}

async function groupAction(ctx: AnyContext, group: ProductGroup) {
  const user = await getUserOrLeave(ctx);

  if (!user) {
    return;
  }

  const filteredGroup = filterProductGroup(user, group);

  const { messages, buttons } = listProducts(filteredGroup.products);

  await replyWithKeyboard(
    ctx,
    inlineKeyboard(...buttons, cancelButton),
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

function filterPurchasable(user: User, products: Product[]): Product[] {
  return products
    .filter(product => canPurchaseProduct(user, product.code));
}

function listProducts(products: Product[]): MessagesAndButtons {
  const messages: Message[] = [];
  const buttons: ButtonLike[] = [];

  for (const product of products) {
    const productPlan = getSubscriptionPlan(product);

    messages.push(getPlanDescription(productPlan));
    buttons.push([
      `Купить ${getProductShortName(product)}`,
      getProductBuyAction(product.code)
    ]);
  }

  return { messages, buttons };
}

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
