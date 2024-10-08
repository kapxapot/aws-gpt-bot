import { BaseScene } from "telegraf/scenes";
import { BotContext } from "../botContext";
import { commands, scenes } from "../../lib/constants";
import { addSceneCommandHandlers, backToChatHandler, dunnoHandler, kickHandler } from "../handlers";
import { ButtonLike, clearInlineKeyboard, contactKeyboard, emptyKeyboard, inlineKeyboard, reply, replyWithKeyboard } from "../../lib/telegram";
import { Product, ProductCode, freeSubscription, isPurchasableProduct, productCodes } from "../../entities/product";
import { isError } from "../../lib/error";
import { canMakePurchases, canPurchaseProduct } from "../../services/permissionService";
import { backToStartAction, cancelAction, getCancelButton } from "../../lib/dialog";
import { notAllowedMessage, replyBackToMainDialog, withUser } from "../../services/messageService";
import { SessionData } from "../session";
import { StringLike, isEmpty, phoneToItu } from "../../lib/common";
import { message } from "telegraf/filters";
import { updateUser } from "../../storage/userStorage";
import { formatProductDescription, formatProductDescriptions, getPrettyProductName, getProductByCode } from "../../services/productService";
import { User } from "../../entities/user";
import { gptokenString } from "../../services/gptokenService";
import { bulletize, compactText, text } from "../../lib/text";
import { createPayment } from "../../services/paymentService";
import { Markup } from "telegraf";
import { getUserActiveCoupons, getUserActiveProducts } from "../../services/userService";
import { formatCouponsString } from "../../services/couponService";
import { getGptokenUsagePoints } from "../../services/modelUsageService";
import { getModelName, gptDefaultModelName, gptPremiumModelName } from "../../services/modelService";
import { formatSubscriptionDescription } from "../../services/subscriptionService";
import { gptProducts } from "../../entities/products/gptProducts";
import { gptokenProducts } from "../../entities/products/gptokenProducts";
import { formatCommand } from "../../lib/commands";
import { orJoin, t } from "../../lib/translate";

type Message = string;

type MessagesAndButtons = {
  messages: Message[];
  buttons: ButtonLike[];
};

type ProductGroup = {
  code: "gptoken" | "gpt-default";
  name: string;
  products: Product[];
  getMarketingMessage: (user: User) => string;
  getDescription: (user: User) => string;
};

const usagePoints = getGptokenUsagePoints();

const productGroups: ProductGroup[] = [
  {
    code: "gpt-default",
    name: gptDefaultModelName,
    products: gptProducts,
    getMarketingMessage: (user: User) => t(
      user,
      "productGroups.gpt-default.marketing",
      { gptDefaultModelName }
    ),
    getDescription: (user: User) => t(
      user,
      "productGroups.gpt-default.description",
      { gptDefaultModelName }
    )
  },
  {
    code: "gptoken",
    name: `${gptPremiumModelName} / DALL-E`,
    products: gptokenProducts,
    getMarketingMessage: (user: User) => t(
      user,
      "productGroups.gptoken.marketing",
      { gptPremiumModelName }
    ),
    getDescription: (user: User) => text(
      t(user, "productGroups.gptoken.description.intro", { gptPremiumModelName }),
      compactText(
        ...bulletize(
          t(user, "productGroups.gptoken.description.gpt4", {
            model: getModelName("gpt4"),
            usagePoints: gptokenString(user, usagePoints.text)
          }),
          t(user, "productGroups.gptoken.description.dalle3", {
            model: getModelName("dalle3"),
            usagePoints: gptokenString(user, usagePoints.image, "Genitive")
          })
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
    formatProductDescriptions(user, products),
    formatSubscriptionDescription(user, freeSubscription)
  ];

  const coupons = getUserActiveCoupons(user);

  if (!isEmpty(coupons)) {
    messages.push(
      formatCouponsString(user, coupons)
    );
  }

  if (!productCount) {
    messages.push(t(user, "noAvailableProducts"));

    if (!canMakePurchases(user)) {
      await replyBackToMainDialog(
        ctx,
        ...messages,
        notAllowedMessage(user, t(user, "purchasesUnavailable"))
      );
    }

    return;
  }

  const marketingMessages = validProductGroups.map(group => group.getMarketingMessage(user));
  const marketingBlock = orJoin(user, ...marketingMessages);

  messages.push(
    t(user, "buyProductIfNeeded", { marketingBlock })
  );

  await replyWithKeyboard(
    ctx,
    inlineKeyboard(
      ...validProductGroups.map(group => productGroupButton(user, group)),
      getCancelButton(user)
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
    const { messages, buttons } = listProducts(user, filteredGroup.products);

    await replyWithKeyboard(
      ctx,
      inlineKeyboard(
        ...buttons,
        {
          label: t(user, "Back"),
          action: backToStartAction
        },
        getCancelButton(user)
      ),
      group.getDescription(user),
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
    await askForPhone(ctx, user);
  });
}

async function askForPhone(ctx: BotContext, user: User) {
  const contactRequestLabel = getContactRequestLabel(user);

  await ctx.reply(
    t(user, "phoneInput", { contactRequestLabel }),
    contactKeyboard(contactRequestLabel)
  );
}

scene.on(message("contact"), async ctx => {
  await withUser(ctx, async user => {
    const contact = ctx.message.contact.phone_number;
    const formattedPhone = phoneToItu(contact);

    if (!formattedPhone) {
      const contactRequestLabel = getContactRequestLabel(user);

      await ctx.reply(
        t(user, "incorrectPhoneNumberFormat"),
        contactKeyboard(contactRequestLabel)
      );

      return;
    }

    const updatedUser = await updateUser(user, { phoneNumber: contact });

    await ctx.reply(
      t(user, "gotYourPhoneNumber"),
      emptyKeyboard()
    );

    const targetProductCode = getTargetProductCode(ctx.session);

    if (
      !targetProductCode
      || !canPurchaseProduct(updatedUser, targetProductCode)
    ) {
      await reply(ctx, t(user, "selectedProductUnavailable"));
      backToChatHandler(ctx);

      return;
    }

    await buyProduct(ctx, targetProductCode);
  });
});

async function buyProduct(ctx: BotContext, productCode: ProductCode) {
  await clearInlineKeyboard(ctx);

  await withUser(ctx, async user => {
    const product = getProductByCode(user, productCode);

    if (!isPurchasableProduct(product)) {
      await replyBackToMainDialog(ctx, t(user, "productCantBePurchased"));
      return;
    }

    const payment = await createPayment(user, product);

    if (isError(payment)) {
      await replyBackToMainDialog(
        ctx,
        t(user, "errors.paymentError"),
        payment.message
      );

      return;
    }

    const productNameGen = getPrettyProductName(user, product, { targetCase: "Genitive" });

    await replyWithKeyboard(
      ctx,
      inlineKeyboard(
        Markup.button.url(t(user, "makePayment"), payment.url),
        {
          label: t(user, "buyOneMoreMasculine"),
          action: backToStartAction
        },
        getCancelButton(user)
      ),
      t(user, "goToPayment", {
        productNameGen,
        paymentUrl: payment.url,
        premiumCommand: formatCommand(commands.premium)
      })
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

function listProducts(user: User, products: Product[]): MessagesAndButtons {
  const messages: Message[] = [];
  const buttons: ButtonLike[] = [];

  for (const product of products) {
    messages.push(
      formatProductDescription(user, product, {
        showPrice: true
      })
    );

    buttons.push(
      productButton(user, product)
    );
  }

  return { messages, buttons };
}

const productButton = (user: User, product: Product): ButtonLike => ({
  label: getPrettyProductName(user, product),
  action: getProductBuyAction(product.code)
});

const productGroupButton = (user: User, group: ProductGroup): ButtonLike => ({
  label: t(user, "productGroup", {
    groupName: group.name
  }),
  action: getGroupAction(group)
});

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

const getContactRequestLabel = (user: User) =>
  t(user, "📱 Send phone number");
