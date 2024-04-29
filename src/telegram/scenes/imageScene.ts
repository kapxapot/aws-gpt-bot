import { BaseScene } from "telegraf/scenes";
import { BotContext } from "../botContext";
import { commands, scenes, settings, symbols } from "../../lib/constants";
import { addOtherCommandHandlers, backToMainDialogHandler, dunnoHandler, kickHandler } from "../handlers";
import { clearInlineKeyboard, inlineKeyboard, reply, replyWithKeyboard } from "../../lib/telegram";
import { message } from "telegraf/filters";
import { generateImageWithGpt } from "../../services/imageService";
import { ImageStage, SessionData } from "../session";
import { anotherImageAction, cancelAction, cancelButton } from "../../lib/dialog";
import { getUserOrLeave } from "../../services/messageService";
import { capitalize, commatize, toCompactText } from "../../lib/common";
import { getImageModelContext } from "../../services/modelContextService";
import { ImageModelCode } from "../../entities/model";
import { ConsumptionLimit, ConsumptionLimits, IntervalConsumptionLimits } from "../../entities/consumption";
import { getIntervalString } from "../../services/intervalService";
import { formatLimit } from "../../services/usageLimitService";
import { isConsumptionLimit } from "../../services/consumptionService";
import { getCaseForNumber } from "../../services/grammarService";
import { gptokenString } from "../../services/gptokenService";
import { bulletize } from "../../lib/text";

const scene = new BaseScene<BotContext>(scenes.image);

scene.enter(mainHandler);

addOtherCommandHandlers(scene, commands.image);

scene.action(cancelAction, backToMainDialogHandler);

scene.on(message("text"), async ctx => {
  if (isStage(ctx.session, "imagePromptInput")) {
    await clearInlineKeyboard(ctx);

    const user = await getUserOrLeave(ctx);

    if (!user) {
      return;
    }

    const imagePrompt = ctx.message.text;

    await generateImageWithGpt(ctx, user, imagePrompt);

    setStage(ctx.session, "anotherImage");

    return;
  }

  if (isStage(ctx.session, "anotherImage")) {
    await backToMainDialogHandler(ctx);
    return;
  }

  await dunnoHandler(ctx);
});

scene.action(anotherImageAction, async ctx => {
  await clearInlineKeyboard(ctx);
  await mainHandler(ctx);
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

  const {
    modelCode,
    model,
    imageSettings,
    usagePoints,
    consumptionLimits,
    activeConsumptionLimit
  } = getImageModelContext(user);

  const imageGenerationAllowed = activeConsumptionLimit
    && activeConsumptionLimit.remaining >= usagePoints;

  const formattedLimits = consumptionLimits
    ? formatConsumptionLimits(consumptionLimits, modelCode, usagePoints)
    : "";

  if (!imageGenerationAllowed) {
    await reply(
      ctx,
      formattedLimits,
      "⛔ Генерация картинок недоступна."
    );

    await ctx.scene.leave();

    return;
  }

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
