import { BaseScene } from "telegraf/scenes";
import { BotContext } from "../botContext";
import { commands, scenes, settings } from "../../lib/constants";
import { addOtherCommandHandlers, backToMainDialogHandler, dunnoHandler, kickHandler } from "../handlers";
import { canRequestImageGeneration } from "../../services/permissionService";
import { clearInlineKeyboard, inlineKeyboard, reply, replyWithKeyboard } from "../../lib/telegram";
import { message } from "telegraf/filters";
import { generateImageWithGpt } from "../../services/imageService";
import { ImageStage, SessionData } from "../session";
import { cancelAction, cancelButton } from "../../lib/dialog";
import { getUserOrLeave } from "../../services/messageService";

const scene = new BaseScene<BotContext>(scenes.image);

scene.enter(async ctx => {
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

  await replyWithKeyboard(
    ctx,
    inlineKeyboard(cancelButton),
    `Опишите картинку, которую вы хотите сгенерировать (до ${settings.maxImagePromptLength} символов):`
  );
});

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
  
    const result = await generateImageWithGpt(ctx, user, imagePrompt);

    if (result) {
      await backToMainDialogHandler(ctx);
    }

    return;
  }

  await dunnoHandler(ctx);
});

scene.leave(async ctx => {
  delete ctx.session.modeData;
});

scene.use(kickHandler);
scene.use(dunnoHandler);

export const imageScene = scene;

function setStage(session: SessionData, stage: ImageStage) {
  session.imageData = {
    ...session.imageData ?? {},
    stage
  };
}

function isStage(session: SessionData, stage: ImageStage): boolean {
  return session.imageData?.stage === stage;
}
