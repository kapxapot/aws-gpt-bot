import { BaseScene } from "telegraf/scenes";
import { AnyContext, BotContext } from "../botContext";
import { commands, scenes } from "../../lib/constants";
import { addOtherCommandHandlers, backToMainDialogHandler, dunnoHandler, kickHandler } from "../handlers";
import { clearInlineKeyboard, contactKeyboard, emptyKeyboard, inlineKeyboard, replyBackToMainDialog, replyWithKeyboard } from "../../lib/telegram";
import { PaymentEvent } from "../../entities/payment";
import { storePayment } from "../../storage/paymentStorage";
import { yooMoneyPayment } from "../../external/yooMoneyPayment";
import { now } from "../../entities/at";
import { Product, getProductDisplayName, isPurchasedProduct, monthlyPremiumSubscription, monthlyUnlimitedSubscription } from "../../entities/product";
import { isError } from "../../lib/error";
import { formatUserSubscription, getCurrentSubscription, getSubscriptionPlan } from "../../services/subscriptionService";
import { canMakePurchases } from "../../services/permissionService";
import { cancelAction, cancelButton } from "../../lib/dialog";
import { getUserOrLeave } from "../../services/messageService";
import { getUserPlanSettings } from "../../services/userService";
import { getPlanSettings, getPlanSettingsLimitText } from "../../services/planSettingsService";
import { SessionData } from "../session";
import { Plan } from "../../entities/plan";
import { phoneToItu, toText } from "../../lib/common";
import { message } from "telegraf/filters";
import { updateUser } from "../../storage/userStorage";

const scene = new BaseScene<BotContext>(scenes.premium);

const buyPremiumAction = "buy-premium";
const buyUnlimitedAction = "buy-unlimited";

scene.enter(async ctx => {
  const user = await getUserOrLeave(ctx);

  if (!user) {
    return;
  }

  // get plan messages
  const userPlanSettings = getUserPlanSettings(user);
  const premiumSettings = getPlanSettings("premium");
  const unlimitedSettings = getPlanSettings("unlimited");

  const premiumActive = premiumSettings.active;
  const unlimitedActive = unlimitedSettings.active;

  const messages = [
    "Текущий тариф:",

    `${formatUserSubscription(user)}:
◽ модель <b>${userPlanSettings.text.model}</b>
◽ ${getPlanSettingsLimitText(userPlanSettings)}`
  ];

  if (premiumActive || unlimitedActive) {
    messages.push(
      "Если вам нужно больше ежедневных запросов к <b>ChatGPT</b> или вы хотите работать с <b>GPT-4</b>, оформите подписку на один из платных тарифов:"
    );

    if (premiumActive) {
      messages.push(
        `💚 Тариф <b>«Премиум»</b>:
◽ модель <b>${premiumSettings.text.model}</b>
◽ ${getPlanSettingsLimitText(premiumSettings)}
◽ 290 рублей на 30 дней`
      );
    }

    if (unlimitedActive) {
      messages.push(
        `💛 Тариф <b>«Безлимит»</b>:
◽ модель <b>${unlimitedSettings.text.model}</b>
◽ ${getPlanSettingsLimitText(unlimitedSettings)}
◽ 390 рублей на 30 дней`
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

  const subscription = getCurrentSubscription(user);

  if (isPurchasedProduct(subscription)) {
    const plan = getSubscriptionPlan(subscription);

    switch (plan) {
      case "premium":
        if (unlimitedActive) {
          buttons.push(
            ["Купить Безлимит", buyUnlimitedAction]
          );
  
          messages.push("⚠ Ваш текущий тариф <b>«Премиум»</b>. Вы можете приобрести <b>«Безлимит»</b>, который заменит текущий тариф <b>без компенсации средств</b>.");
        } else {
          messages.push("⚠ Ваш текущий тариф <b>«Премиум»</b>. Вы не можете приобрести другие тарифы, пока у вас не закончится текущий.");
        }

        break;

      case "unlimited":
        messages.push("⚠ Ваш текущий тариф <b>«Безлимит»</b>. Вы не можете приобрести другие тарифы, пока у вас не закончится текущий.");

        break;
    }
  } else {
    if (premiumActive) {
      buttons.push(["Купить Премиум", buyPremiumAction]);
    }

    if (unlimitedActive) {
      buttons.push(["Купить Безлимит", buyUnlimitedAction]);
    }
  }

  await replyWithKeyboard(
    ctx,
    inlineKeyboard(...buttons, cancelButton),
    ...messages
  );
});

addOtherCommandHandlers(scene, commands.premium);

scene.action(buyPremiumAction, async ctx => {
  await clearInlineKeyboard(ctx);

  const user = await getUserOrLeave(ctx);

  if (!user) {
    return;
  }

  if (user.phoneNumber) {
    await buyPremium(ctx);
    return;
  }

  // ask for phone number and then buy premium
  setTargetPlan(ctx.session, "premium");
  await askForPhone(ctx);
});

scene.action(buyUnlimitedAction, async ctx => {
  await clearInlineKeyboard(ctx);

  const user = await getUserOrLeave(ctx);

  if (!user) {
    return;
  }

  if (user.phoneNumber) {
    await buyUnlimited(ctx);
    return;
  }

  // ask for phone number and then buy unlimited
  setTargetPlan(ctx.session, "unlimited");
  await askForPhone(ctx);
});

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

  const targetPlan = getTargetPlan(ctx.session);

  if (!targetPlan) {
    backToMainDialogHandler(ctx);
    return;
  }

  switch (targetPlan) {
    case "premium":
      await buyPremium(ctx);
      break;

    case "unlimited":
      await buyUnlimited(ctx);
      break;
  }
});

async function buyPremium(ctx: AnyContext) {
  const product = monthlyPremiumSubscription();
  await buyProduct(ctx, product);
}

async function buyUnlimited(ctx: AnyContext) {
  const product = monthlyUnlimitedSubscription();
  await buyProduct(ctx, product);
}

async function buyProduct(ctx: BotContext, product: Product) {
  const user = await getUserOrLeave(ctx);

  if (!user) {
    return;
  }

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
    `💳 Для оплаты <b>${getProductDisplayName(product, "Gen")}</b> пройдите по ссылке:`,
    paymentUrl,
    `⚠ Время действия ссылки ограничено. Если вы не успеете оплатить счет, вы можете получить новую ссылку с помощью команды /${commands.premium}`,
    "Мы сообщим вам, когда получим оплату."
  );
}

scene.action(cancelAction, backToMainDialogHandler);

scene.use(kickHandler);
scene.use(dunnoHandler);

export const premiumScene = scene;

function setTargetPlan(session: SessionData, targetPlan: Plan) {
  session.premiumData = {
    ...session.premiumData ?? {},
    targetPlan
  };
}

function getTargetPlan(session: SessionData): Plan | null {
  return session.premiumData?.targetPlan ?? null;
}
