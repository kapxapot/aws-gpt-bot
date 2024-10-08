import { BaseScene } from "telegraf/scenes";
import { BotContext } from "../botContext";
import { commands, scenes, settings } from "../../lib/constants";
import { addSceneCommandHandlers, backToChatHandler, dunnoHandler, kickHandler } from "../handlers";
import { clearAndLeave, clearInlineKeyboard, inlineKeyboard, replyWithKeyboard } from "../../lib/telegram";
import { message } from "telegraf/filters";
import { generateImageWithGpt } from "../../services/imageService";
import { ImageStage, SessionData } from "../session";
import { backToStartAction, cancelAction, getCancelButton, getGotoPremiumButton, gotoPremiumAction } from "../../lib/dialog";
import { notAllowedMessage, replyBackToMainDialog, withUser } from "../../services/messageService";
import { gptokenString } from "../../services/gptokenService";
import { bullet, bulletize, capitalize, compactText, text } from "../../lib/text";
import { getImageModelContexts, getUsableModelContext } from "../../services/modelContextService";
import { freeSubscription } from "../../entities/product";
import { ImageModelContext } from "../../entities/modelContext";
import { User } from "../../entities/user";
import { getPrettySubscriptionName } from "../../services/subscriptionService";
import { formatRemainingLimits } from "../../services/consumptionFormatService";
import { canGenerateImages } from "../../services/permissionService";
import { formatCommand } from "../../lib/commands";
import { t } from "../../lib/translate";

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
      notAllowedMessage(user, t(user, "imageGenerationUnavailable"))
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

  const modelDescription = [
    `${t(user, "model")}: ${model}`,
    `${t(user, "size")}: ${imageSettings.size}`
  ];

  if (imageSettings.quality) {
    modelDescription.push(
      `${t(user, "quality")}: ${imageSettings.quality}`
    );
  }

  if (modelCode === "gptokens") {
    modelDescription.push(
      `${t(user, "cost")}: ${gptokenString(user, usagePoints)}`
    );
  }

  const formattedLimits = limits
    ? formatRemainingLimits(user, limits, modelCode, usagePoints, "image")
    : "";

  await replyWithKeyboard(
    ctx,
    inlineKeyboard(getCancelButton(user)),
    t(user, "imageGeneration"),
    compactText(
      ...bulletize(...modelDescription),
    ),
    capitalize(formattedLimits),
    t(user, "enterImagePrompt", {
      maxLength: settings.maxImagePromptLength
    })
  );
}

async function getImageModelContext(ctx: BotContext, user: User): Promise<ImageModelContext | null> {
  const contexts = getImageModelContexts(user);
  const usableContext = getUsableModelContext(contexts);

  if (usableContext) {
    return usableContext;
  }

  const messages: string[] = [];

  for (const context of contexts) {
    const { product, modelCode, limits, usagePoints } = context;

    if (!limits) {
      continue;
    }

    const subscription = product ?? freeSubscription;
    const formattedLimits = formatRemainingLimits(user, limits, modelCode, usagePoints, "image");

    messages.push(
      compactText(
        `<b>${getPrettySubscriptionName(user, subscription)}</b>`,
        bullet(capitalize(formattedLimits))
      )
    );
  }

  await replyWithKeyboard(
    ctx,
    inlineKeyboard(
      getGotoPremiumButton(user),
      getCancelButton(user)
    ),
    text(...messages),
    t(user, "imageGenerationUnavailable"),
    t(user, "waitOrBuy", {
      premiumCommand: formatCommand(commands.premium)
    })
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
