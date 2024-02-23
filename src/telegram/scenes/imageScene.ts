import { BaseScene } from "telegraf/scenes";
import { BotContext, ImageStage, SessionData } from "../botContext";
import { commands, messages, scenes, settings } from "../../lib/constants";
import { getOrAddUser } from "../../services/userService";
import { addOtherCommandHandlers, dunnoHandler, kickHandler } from "../handlers";
import { canRequestImageGeneration } from "../../services/permissionService";
import { clearInlineKeyboard, inlineKeyboard, reply, replyWithKeyboard } from "../../lib/telegram";
import { message } from "telegraf/filters";
import { generateImageWithGpt } from "../../services/imageService";

const scene = new BaseScene<BotContext>(scenes.image);

const cancelAction = "cancel";
const cancelButton = ["Отмена", cancelAction];

scene.enter(async (ctx) => {
  if (!ctx.from) {
    await ctx.scene.leave();
    return;
  }

  const user = await getOrAddUser(ctx.from);
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

scene.action(cancelAction, async (ctx) => {
  await clearInlineKeyboard(ctx);
  await ctx.scene.leave();
  await reply(ctx, messages.backToDialog);
});

scene.on(message("text"), async (ctx) => {
  if (isStage(ctx.session, "imagePromptInput")) {
    await clearInlineKeyboard(ctx);

    // generate image
    const imagePrompt = ctx.message.text;
    const user = await getOrAddUser(ctx.from);

    await ctx.scene.leave();
    await generateImageWithGpt(ctx, user, imagePrompt);

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
  session.imageData = { stage };
}

function isStage(session: SessionData, stage: ImageStage): boolean {
  return session.imageData?.stage === stage;
}
