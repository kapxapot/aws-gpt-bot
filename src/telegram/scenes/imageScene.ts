import { BaseScene } from "telegraf/scenes";
import { BotContext } from "../botContext";
import { commands, scenes, settings } from "../../lib/constants";
import { addSceneCommandHandlers, backToChatHandler, dunnoHandler, kickHandler } from "../handlers";
import { clearAndLeave, clearInlineKeyboard, inlineKeyboard, replyWithKeyboard } from "../../lib/telegram";
import { message } from "telegraf/filters";
import { generateImageWithGpt } from "../../services/imageService";
import { ImageStage, SessionData } from "../session";
import { backToStartAction, cancelAction, cancelButton, gotoPremiumAction, gotoPremiumButton } from "../../lib/dialog";
import { notAllowedMessage, replyBackToMainDialog, withUser } from "../../services/messageService";
import { capitalize, cleanJoin, toCompactText, toText } from "../../lib/common";
import { gptokenString } from "../../services/gptokenService";
import { bullet, bulletize } from "../../lib/text";
import { getImageModelContexts } from "../../services/modelContextService";
import { freeSubscription } from "../../entities/product";
import { ImageModelContext } from "../../entities/modelContext";
import { User } from "../../entities/user";
import { getSubscriptionShortDisplayName } from "../../services/subscriptionService";
import { formatImageConsumptionLimits } from "../../services/consumptionFormatService";
import { canGenerateImages } from "../../services/permissionService";

const scene = new BaseScene<BotContext>(scenes.image);

scene.enter(mainHandler);

addSceneCommandHandlers(scene);

scene.action(cancelAction, backToChatHandler);

scene.on(message("text"), async ctx => {
  if (isStage(ctx.session, "imagePromptInput")) {
    await clearInlineKeyboard(ctx);

    await withUser(ctx, async user => {
      const imageModelContext = await getImageModelContext(ctx, user);

      if (!imageModelContext) {
        return;
      }

      const imagePrompt = ctx.message.text;
      const result = await generateImageWithGpt(ctx, imageModelContext, user, imagePrompt);

      if (result) {
        setStage(ctx.session, "imageCreated");
      }
    });

    return;
  }

  await backToChatHandler(ctx);
});

scene.action(backToStartAction, async ctx => {
  await clearInlineKeyboard(ctx);
  await mainHandler(ctx);
});

scene.action(gotoPremiumAction, async ctx => {
  await clearAndLeave(ctx);
  await ctx.scene.enter(scenes.premium);
});

scene.leave(async ctx => {
  delete ctx.session.imageData;
});

scene.use(kickHandler);
scene.use(dunnoHandler);

export const imageScene = scene;

async function mainHandler(ctx: BotContext) {
  await withUser(
    ctx,
    async user => await imagePromptInput(ctx, user)
  );
}

async function imagePromptInput(ctx: BotContext, user: User) {
  if (!canGenerateImages(user)) {
    await replyBackToMainDialog(
      ctx,
      notAllowedMessage("Генерация картинок недоступна.")
    );

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
    ? formatImageConsumptionLimits(limits, modelCode, usagePoints)
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
      ? formatImageConsumptionLimits(limits, modelCode, usagePoints)
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
    inlineKeyboard(gotoPremiumButton, cancelButton),
    toText(...messages),
    "⛔ Генерация картинок недоступна.",
    `Подождите или приобретите пакет услуг: /${commands.premium}`
  );

  return null;
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
