import { BaseScene } from "telegraf/scenes";
import { BotContext } from "../botContext";
import { commands, scenes } from "../../lib/constants";
import { addOtherCommandHandlers, backToMainDialogHandler, dunnoHandler, kickHandler } from "../handlers";
import { clearAndLeave, inlineKeyboard, replyBackToMainDialog, replyWithKeyboard } from "../../lib/telegram";
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
import { cancelAction, cancelButton } from "../../lib/dialog";
import { User } from "../../entities/user";

const scene = new BaseScene<BotContext>(scenes.premium);

const buyPremiumAction = "buy-premium";
const buyUnlimitedAction = "buy-unlimited";

function getPlanMessages(user: User): string[] {
  const userPlanSettings = getUserPlanSettings(user);
  const premiumSettings = getPlanSettings("premium");
  const unlimitedSettings = getPlanSettings("unlimited");

  const getLimitText = (planSettings: PlanSettings) => {
    const limit = planSettings.text.dailyMessageLimit;
    const displayInfo = getMessageLimitDisplayInfo(limit);

    return displayInfo.long;
  }

  return [
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
}

scene.enter(async (ctx) => {
  if (!ctx.from) {
    await ctx.scene.leave();
    return;
  }

  const user = await getOrAddUser(ctx.from);
  const messages = getPlanMessages(user);
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
    if (subscription.code === "subscription-premium-30-days") {
      buttons.push(
        ["Купить Безлимит", buyUnlimitedAction]
      );

      messages.push("⚠ Ваш текущий тариф <b>«Премиум»</b>. Вы можете приобрести <b>«Безлимит»</b>, который заменит текущий тариф <b>без компенсации средств</b>.");
    } else if (subscription.code === "subscription-unlimited-30-days") {
      messages.push("⚠ Ваш текущий тариф <b>«Безлимит»</b>. Вы не можете приобрести другие тарифы, пока у вас не закончится текущий.");
    }
  } else {
    buttons.push(
      ["Купить Премиум", buyPremiumAction],
      ["Купить Безлимит", buyUnlimitedAction]
    );
  }

  await replyWithKeyboard(
    ctx,
    inlineKeyboard(...buttons, cancelButton),
    ...messages
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
  if (!ctx.from) {
    await clearAndLeave(ctx);
    return;
  }

  const requestData = {
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

  await replyBackToMainDialog(
    ctx,
    `Для оплаты <b>${getProductDisplayName(product, "Gen")}</b> пройдите по ссылке: ${paymentUrl}`,
    `⚠ Время действия ссылки ограничено. Если вы не успеете оплатить счет, вы можете получить новую ссылку с помощью команды /${commands.premium}`,
    "Мы сообщим вам, когда получим оплату."
  );
}

scene.action(cancelAction, backToMainDialogHandler);

scene.use(kickHandler);
scene.use(dunnoHandler);

export const premiumScene = scene;
