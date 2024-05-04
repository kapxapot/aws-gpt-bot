import { BaseScene } from "telegraf/scenes";
import { BotContext } from "../botContext";
import { commands, scenes, settings, symbols } from "../../lib/constants";
import { addOtherCommandHandlers, backToChatHandler, dunnoHandler, kickHandler } from "../handlers";
import { clearAndLeave, clearInlineKeyboard, inlineKeyboard, replyWithKeyboard } from "../../lib/telegram";
import { message } from "telegraf/filters";
import { generateImageWithGpt } from "../../services/imageService";
import { ImageStage, SessionData } from "../session";
import { anotherImageAction, cancelAction, cancelButton } from "../../lib/dialog";
import { getUserOrLeave } from "../../services/messageService";
import { capitalize, cleanJoin, commatize, toCompactText, toText } from "../../lib/common";
import { ImageModelCode } from "../../entities/model";
import { ConsumptionLimit, ConsumptionLimits, IntervalConsumptionLimits } from "../../entities/consumption";
import { getIntervalString } from "../../services/intervalService";
import { formatLimit } from "../../services/usageLimitService";
import { isConsumptionLimit } from "../../services/consumptionService";
import { getCaseForNumber } from "../../services/grammarService";
import { gptokenString } from "../../services/gptokenService";
import { bullet, bulletize } from "../../lib/text";
import { getImageModelContexts } from "../../services/modelContextService";
import { freeSubscription } from "../../entities/product";
import { ImageModelContext } from "../../entities/modelContext";
import { User } from "../../entities/user";
import { getSubscriptionShortDisplayName } from "../../services/subscriptionService";

const gotoPremiumAction = "gotoPremium";
const scene = new BaseScene<BotContext>(scenes.image);

scene.enter(mainHandler);

addOtherCommandHandlers(scene, commands.image);

scene.action(cancelAction, backToChatHandler);

scene.on(message("text"), async ctx => {
  if (isStage(ctx.session, "imagePromptInput")) {
    await clearInlineKeyboard(ctx);

    const user = await getUserOrLeave(ctx);

    if (!user) {
      return;
    }

    const imageModelContext = await getImageModelContext(ctx, user);

    if (!imageModelContext) {
      return;
    }

    const imagePrompt = ctx.message.text;

    const result = await generateImageWithGpt(ctx, imageModelContext, user, imagePrompt);

    if (result) {
      setStage(ctx.session, "anotherImage");
    }

    return;
  }

  if (isStage(ctx.session, "anotherImage")) {
    await backToChatHandler(ctx);
    return;
  }

  await dunnoHandler(ctx);
});

scene.action(anotherImageAction, async ctx => {
  await clearInlineKeyboard(ctx);
  await mainHandler(ctx);
});

scene.action(gotoPremiumAction, async ctx => {
  await clearAndLeave(ctx);
  await ctx.scene.enter(scenes.premium);
});

scene.leave(async ctx => {
  delete ctx.session.modeData;
});

scene.use(kickHandler);
scene.use(dunnoHandler);

export const imageScene = scene;

async function mainHandler (ctx: BotContext) {
  const user = await getUserOrLeave(ctx);

  if (!user) {
    return;
  }

  const imageModelContext = await getImageModelContext(ctx, user);

  if (!imageModelContext) {
    return;
  }

  const {
    modelCode,
    model,
    imageSettings,
    usagePoints,
    limits
  } = imageModelContext;

  setStage(ctx.session, "imagePromptInput");

  const modelDescription: string[] = [
    `модель: ${model}`,
    `размер: ${imageSettings.size}`,
  ];

  if (imageSettings.quality) {
    modelDescription.push(`качество: ${imageSettings.quality}`);
  }

  if (modelCode === "gptokens") {
    modelDescription.push(`стоимость: ${gptokenString(usagePoints)}`);
  }

  const formattedLimits = limits
    ? formatConsumptionLimits(limits, modelCode, usagePoints)
    : "";

  await replyWithKeyboard(
    ctx,
    inlineKeyboard(cancelButton),
    `🖼 Генерация картинок с помощью <b>DALL-E</b>`,
    toCompactText(
      ...bulletize(...modelDescription),
    ),
    formattedLimits,
    `Опишите картинку, которую хотите сгенерировать (до ${settings.maxImagePromptLength} символов):`
  );
}

async function getImageModelContext(ctx: BotContext, user: User): Promise<ImageModelContext | null> {
  const contexts = getImageModelContexts(user);
  const usableContext = contexts.find(context => context.usable);

  if (usableContext) {
    return usableContext;
  }

  const messages: string[] = [];

  for (const context of contexts) {
    const { product, modelCode, limits, usagePoints } = context;

    const formattedLimits = limits
      ? formatConsumptionLimits(limits, modelCode, usagePoints)
      : "неопределенный лимит";

    const subscription = product ?? freeSubscription;

    const productNameParts = [
      subscription.icon,
      capitalize(getSubscriptionShortDisplayName(subscription))
    ];

    messages.push(
      toCompactText(
        `<b>${cleanJoin(productNameParts)}</b>`,
        bullet(formattedLimits)
      )
    );
  }

  await replyWithKeyboard(
    ctx,
    inlineKeyboard(
      ["Пакеты услуг", gotoPremiumAction],
      cancelButton
    ),
    toText(...messages),
    "⛔ Генерация картинок недоступна.",
    `Подождите или приобретите пакет услуг: /${commands.premium}`
  );

  return null;
}

function formatConsumptionLimits(
  limits: ConsumptionLimits,
  modelCode: ImageModelCode,
  usagePoints: number
): string {
  const gptokens = modelCode === "gptokens";
  const what = gptokens ? "гптокенов" : "запросов";

  const formattedLimits = isConsumptionLimit(limits)
    ? formatConsumptionLimit(limits, gptokens, what, usagePoints)
    : formatIntervalConsumptionLimits(limits, gptokens, what, usagePoints);

  const capLimits = capitalize(formattedLimits);

  return gptokens
    ? `${symbols.gptoken} ${capLimits}`
    : capLimits;
}

function formatConsumptionLimit(
  { limit, remaining }: ConsumptionLimit,
  gptokens: boolean,
  what: string,
  usagePoints: number
): string {
  let formatted = `осталось ${what}: ${remaining}/${formatLimit(limit)}`;

  if (gptokens) {
    const imageCount = Math.floor(remaining / usagePoints);
    formatted += ` = ${imageCount} ${getCaseForNumber("картинка", imageCount)}`;
  }

  return formatted;
}

function formatIntervalConsumptionLimits(
  limits: IntervalConsumptionLimits,
  gptokens: boolean,
  what: string,
  usagePoints: number
): string {
  const chunks: string[] = [];

  for (const { interval, limit, remaining } of limits) {
    let formatted = `осталось ${what} в ${getIntervalString(interval, "Accusative")}: ${remaining}/${formatLimit(limit)}`;

    if (gptokens) {
      const imageCount = Math.floor(remaining / usagePoints);
      formatted += ` = ${imageCount} ${getCaseForNumber("картинка", imageCount)}`;
    }

    chunks.push(formatted);
  }

  return commatize(chunks);
}

function setStage(session: SessionData, stage: ImageStage) {
  session.imageData = {
    ...session.imageData ?? {},
    stage
  };
}

function isStage(session: SessionData, stage: ImageStage): boolean {
  return session.imageData?.stage === stage;
}
