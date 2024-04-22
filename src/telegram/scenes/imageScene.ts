import { BaseScene } from "telegraf/scenes";
import { BotContext } from "../botContext";
import { commands, gptokenSymbol, scenes, settings } from "../../lib/constants";
import { addOtherCommandHandlers, backToMainDialogHandler, dunnoHandler, kickHandler } from "../handlers";
import { canRequestImageGeneration } from "../../services/permissionService";
import { clearInlineKeyboard, inlineKeyboard, reply, replyWithKeyboard } from "../../lib/telegram";
import { message } from "telegraf/filters";
import { generateImageWithGpt } from "../../services/imageService";
import { ImageStage, SessionData } from "../session";
import { anotherImageAction, cancelAction, cancelButton } from "../../lib/dialog";
import { getUserOrLeave } from "../../services/messageService";
import { capitalize, commatize, toCompactText } from "../../lib/common";
import { getImageModelContext } from "../../services/modelContextService";
import { User } from "../../entities/user";
import { PurchasedProduct } from "../../entities/product";
import { ImageModelCode, PureImageModelCode } from "../../entities/model";
import { Consumption, IntervalConsumptions, isIntervalConsumptions } from "../../entities/consumption";
import { getIntervalString } from "../../services/intervalService";
import { formatLimit } from "../../services/usageLimitService";
import { getConsumptionReport } from "../../services/consumptionService";
import { getCaseForNumber } from "../../services/grammarService";
import { gptokenString } from "../../services/gptokenService";

const scene = new BaseScene<BotContext>(scenes.image);

scene.enter(mainHandler);

addOtherCommandHandlers(scene, commands.image);

scene.action(cancelAction, backToMainDialogHandler);

scene.on(message("text"), async ctx => {
  if (isStage(ctx.session, "imagePromptInput")) {
    await clearInlineKeyboard(ctx);

    const imagePrompt = ctx.message.text;

    const user = await getUserOrLeave(ctx);

    if (!user) {
      return;
    }

    await generateImageWithGpt(ctx, user, imagePrompt);

    setStage(ctx.session, "oneMore");

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

  const imageGenerationAllowed = canRequestImageGeneration(user);

  if (!imageGenerationAllowed) {
    await reply(ctx, "⛔ Генерация картинок недоступна.");
    await ctx.scene.leave();
    return;
  }

  setStage(ctx.session, "imagePromptInput");

  const { product, modelCode, pureModelCode, model, imageSettings, usagePoints } =
    getImageModelContext(user);

  const modelDescription: string[] = [
    `🔸 модель: ${model}`,
    `🔸 размер: ${imageSettings.size}`,
  ];

  if (imageSettings.quality) {
    modelDescription.push(`🔸 качество: ${imageSettings.quality}`);
  }

  if (modelCode === "gptokens") {
    modelDescription.push(`🔸 стоимость: ${gptokenString(usagePoints)}`);
  }

  const messages = [
    `🖼 Генерация картинок с помощью <b>DALL-E</b>`,
    toCompactText(
      ...modelDescription,
    ),
  ];

  const consumptionReport = buildConsumptionReport(user, product, modelCode, pureModelCode, usagePoints);

  if (consumptionReport) {
    messages.push(consumptionReport);
  }

  await replyWithKeyboard(
    ctx,
    inlineKeyboard(cancelButton),
    ...messages,
    `Опишите картинку, которую хотите сгенерировать (до ${settings.maxImagePromptLength} символов):`
  );
}

function buildConsumptionReport(
  user: User,
  product: PurchasedProduct | null,
  modelCode: ImageModelCode,
  pureModelCode: PureImageModelCode,
  usagePoints: number
): string | null {
  const report = getConsumptionReport(user, product, modelCode, pureModelCode);

  if (!report) {
    return null;
  }

  const gptokens = modelCode === "gptokens";
  const what = gptokens ? "гптокенов" : "запросов";

  const formattedConsumption = isIntervalConsumptions(report)
    ? formatIntervalConsumptions(report, gptokens, what, usagePoints)
    : formatConsumption(report, gptokens, what, usagePoints);

  if (!formattedConsumption) {
    return null;
  }

  const capReport = capitalize(formattedConsumption);

  return gptokens
    ? `${gptokenSymbol} ${capReport}`
    : capReport;
}

function formatConsumption(
  consumption: Consumption,
  gptokens: boolean,
  what: string,
  usagePoints: number
): string {
  const remainingCount = consumption.limit - consumption.count;
  let formatted = `осталось ${what}: ${remainingCount}/${consumption.limit}`;

  if (gptokens) {
    const imageCount = Math.floor(remainingCount / usagePoints);
    formatted += ` = ${imageCount} ${getCaseForNumber("картинка", imageCount)}`;
  }

  return formatted;
}

function formatIntervalConsumptions(
  consumptions: IntervalConsumptions,
  gptokens: boolean,
  what: string,
  usagePoints: number
): string {
  const chunks: string[] = [];

  for (const consumption of consumptions) {
    const remainingCount = consumption.limit - consumption.count;

    let formatted = `осталось ${what} в ${getIntervalString(consumption.interval, "Accusative")}: ${remainingCount}/${formatLimit(consumption.limit)}`;

    if (gptokens) {
      const imageCount = Math.floor(remainingCount / usagePoints);
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
