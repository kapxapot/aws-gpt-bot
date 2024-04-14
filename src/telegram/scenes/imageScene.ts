import { BaseScene } from "telegraf/scenes";
import { BotContext } from "../botContext";
import { commands, scenes, settings } from "../../lib/constants";
import { addOtherCommandHandlers, backToMainDialogHandler, dunnoHandler, kickHandler } from "../handlers";
import { canRequestImageGeneration } from "../../services/permissionService";
import { clearInlineKeyboard, inlineKeyboard, reply, replyWithKeyboard } from "../../lib/telegram";
import { message } from "telegraf/filters";
import { generateImageWithGpt, getDefaultImageSettings } from "../../services/imageService";
import { ImageStage, SessionData } from "../session";
import { anotherImageAction, cancelAction, cancelButton } from "../../lib/dialog";
import { getUserOrLeave } from "../../services/messageService";
import { ImageModel, ModelCode } from "../../entities/model";
import { getImageModelByCode } from "../../services/modelService";

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

  const modelCode: ModelCode = "dalle3";
  const model: ImageModel = getImageModelByCode(modelCode);
  const imageSettings = getDefaultImageSettings();

  const modelDescription: string[] = [
    `◽ модель: ${model}`,
    `◽ размер: ${imageSettings.size}`,
  ];

  if (imageSettings.quality) {
    modelDescription.push(`◽ качество: ${imageSettings.quality}`);
  }

  await replyWithKeyboard(
    ctx,
    inlineKeyboard(cancelButton),
    `🖼 В этом режиме вы можете создавать картинки с помощью модели <b>DALL-E</b>:`,
    ...modelDescription,
    `💳 У вас осталось N гптокенов = M картинок.`,
    `Опишите картинку, которую вы хотите сгенерировать (до ${settings.maxImagePromptLength} символов):`
  );
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
