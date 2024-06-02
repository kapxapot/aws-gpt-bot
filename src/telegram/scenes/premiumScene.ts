import { BaseScene } from "telegraf/scenes";
import { BotContext } from "../botContext";
import { commands, scenes, symbols } from "../../lib/constants";
import { addSceneCommandHandlers, backToChatHandler, dunnoHandler, kickHandler } from "../handlers";
import { ButtonLike, clearInlineKeyboard, contactKeyboard, contactRequestLabel, emptyKeyboard, inlineKeyboard, reply, replyWithKeyboard } from "../../lib/telegram";
import { Product, ProductCode, freeSubscription, productCodes } from "../../entities/product";
import { isError } from "../../lib/error";
import { canMakePurchases, canPurchaseProduct } from "../../services/permissionService";
import { backToStartAction, cancelAction, cancelButton } from "../../lib/dialog";
import { getUserOrLeave, notAllowedMessage, replyBackToMainDialog, withUser } from "../../services/messageService";
import { SessionData } from "../session";
import { StringLike, isEmpty, phoneToItu } from "../../lib/common";
import { message } from "telegraf/filters";
import { updateUser } from "../../storage/userStorage";
import { formatProductDescription, formatProductDescriptions, getPrettyProductName, getProductByCode, gpt3Products, gptokenProducts } from "../../services/productService";
import { User } from "../../entities/user";
import { gptokenString } from "../../services/gptokenService";
import { bulletize, orJoin, compactText, text } from "../../lib/text";
import { createPayment } from "../../services/paymentService";
import { Markup } from "telegraf";
import { getUserActiveCoupons, getUserActiveProducts } from "../../services/userService";
import { formatCouponsString } from "../../services/couponService";
import { getGptokenUsagePoints } from "../../services/modelUsageService";
import { getModelName } from "../../services/modelService";
import { formatSubscriptionDescription } from "../../services/subscriptionService";

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

const usagePoints = getGptokenUsagePoints();

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
    description: text(
      `Пакеты ${symbols.gptoken} гптокенов для работы с <b>GPT-4</b> и <b>DALL-E</b>`,
      compactText(
        ...bulletize(
          `1 запрос к <b>${getModelName("gpt4")}</b> (~1000 токенов) = ${gptokenString(usagePoints.text)}`,
          `1 картинка <b>${getModelName("dalle3")}</b> = от ${gptokenString(usagePoints.image, "Genitive")}`
        )
      )
    )
  }
];

const getProductBuyAction = (code: ProductCode) => `buy-${code}`;
const getGroupAction = (group: ProductGroup) => `group-${group.code}`;

const scene = new BaseScene<BotContext>(scenes.premium);

scene.enter(mainHandler);

async function mainHandler(ctx: BotContext) {
  await withUser(
    ctx,
    async user => await sceneIndex(ctx, user)
  );
}

async function sceneIndex(ctx: BotContext, user: User) {
  const validProductGroups = filteredProductGroups(user);
  const productCount = validProductGroups.reduce((sum, group) => sum + group.products.length, 0);
  const products = getUserActiveProducts(user);

  const messages: StringLike[] = [
    formatProductDescriptions(products),
    formatSubscriptionDescription(freeSubscription, user)
  ];

  const coupons = getUserActiveCoupons(user);

  if (!isEmpty(coupons)) {
    messages.push(
      formatCouponsString(coupons)
    );
  }

  if (!productCount) {
    messages.push("На данный момент доступных пакетов нет.");

    if (!canMakePurchases(user)) {
      await replyBackToMainDialog(
        ctx,
        ...messages,
        notAllowedMessage("Покупки недоступны.")
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

addSceneCommandHandlers(scene);

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

async function groupAction(ctx: BotContext, group: ProductGroup) {
  await clearInlineKeyboard(ctx);

  await withUser(ctx, async user => {
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
  });
}

async function buyAction(ctx: BotContext, productCode: ProductCode) {
  await clearInlineKeyboard(ctx);

  await withUser(ctx, async user => {
    if (user.phoneNumber) {
      await buyProduct(ctx, productCode);
      return;
    }

    // ask for phone number and then buy the product
    setTargetProductCode(ctx.session, productCode);
    await askForPhone(ctx);
  });
}

async function askForPhone(ctx: BotContext) {
  await ctx.reply(
    text(
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
      text(
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
    backToChatHandler(ctx);

    return;
  }

  await buyProduct(ctx, targetProductCode);
});

async function buyProduct(ctx: BotContext, productCode: ProductCode) {
  await clearInlineKeyboard(ctx);

  await withUser(ctx, async user => {
    const product = getProductByCode(productCode);
    const payment = await createPayment(user, product);

    if (isError(payment)) {
      await replyBackToMainDialog(
        ctx,
        "Произошла ошибка, оплата временно недоступна. Приносим извинения."
      );

      return;
    }

    const productName = getPrettyProductName(product, { targetCase: "Genitive" });

    await replyWithKeyboard(
      ctx,
      inlineKeyboard(
        Markup.button.url("Оплатить", payment.url),
        ["Купить еще один", backToStartAction],
        cancelButton
      ),
      `${symbols.card} Для оплаты <b>${productName}</b> <a href="${payment.url}">пройдите по ссылке</a>.`,
      `${symbols.warning} Время действия ссылки ограничено. Если вы не успеете оплатить счет, вы можете получить новую ссылку с помощью команды /${commands.premium}`,
      "Мы сообщим вам, когда получим оплату."
    );
  });
}

scene.action(backToStartAction, async ctx => {
  await clearInlineKeyboard(ctx);
  await mainHandler(ctx);
});

scene.action(cancelAction, backToChatHandler);
scene.on(message("text"), backToChatHandler);

scene.leave(async ctx => {
  delete ctx.session.premiumData;
});

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
    messages.push(formatProductDescription(product, { showPrice: true }));
    buttons.push(productButton(product));
  }

  return { messages, buttons };
}

const productButton = (product: Product): ButtonLike => [
  getPrettyProductName(product),
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
