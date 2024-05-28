import { now } from "../entities/at";
import { ImageSettings, defaultImageSize } from "../entities/model";
import { User } from "../entities/user";
import { gptImageGeneration } from "../external/gptImageGeneration";
import { formatWordNumber } from "./grammarService";
import { backToStartAction, cancelButton } from "../lib/dialog";
import { isSuccess } from "../lib/error";
import { inlineKeyboard, reply, replyWithKeyboard } from "../lib/telegram";
import { storeImageRequest, updateImageRequest } from "../storage/imageRequestStorage";
import { BotContext } from "../telegram/botContext";
import { isIntervalElapsed, timeLeft } from "./dateService";
import { gptTimeout } from "./gptService";
import { putMetric } from "./metricService";
import { incUsage } from "./usageStatsService";
import { stopWaitingForGptImageGeneration, updateUserProduct, waitForGptImageGeneration } from "./userService";
import { incProductUsage } from "./productUsageService";
import { Markup } from "telegraf";
import { ImageModelContext } from "../entities/modelContext";
import { symbols } from "../lib/constants";
import { toText } from "../lib/text";

const config = {
  imageInterval: parseInt(process.env.IMAGE_INTERVAL ?? "60") * 1000, // milliseconds
};

export async function generateImageWithGpt(
  ctx: BotContext,
  imageModelContext: ImageModelContext,
  user: User,
  prompt: string
): Promise<boolean> {
  const requestedAt = now();

  const {
    product,
    modelCode,
    pureModelCode,
    model,
    lastUsedAt,
    imageSettings,
    usagePoints
  } = imageModelContext;

  if (user.waitingForGptImageGeneration) {
    if (lastUsedAt && isIntervalElapsed(lastUsedAt.timestamp, gptTimeout * 1000)) {
      // we have waited enough for the GPT answer
      await stopWaitingForGptImageGeneration(user);
    } else {
      await reply(ctx, "Ваша предыдущая картинка еще не готова, подождите... ⏳");
      return false;
    }
  }

  if (config.imageInterval > 0 && lastUsedAt) {
    const seconds = Math.ceil(
      timeLeft(lastUsedAt.timestamp, config.imageInterval) / 1000
    );

    if (seconds > 0) {
      await reply(
        ctx,
        `Вы отправляете запросы слишком часто. Подождите ${formatWordNumber("секунда", seconds)}... ⏳`
      );

      return false;
    }
  }

  const messages = await reply(ctx, "👨‍🎨 Рисую вашу картинку, подождите... ⏳");

  let imageRequest = await storeImageRequest({
    userId: user.id,
    model,
    size: imageSettings.size,
    quality: imageSettings.quality,
    style: imageSettings.style,
    prompt,
    responseFormat: "url",
    requestedAt,
    strict: true
  });

  await waitForGptImageGeneration(user);
  const image = await gptImageGeneration(imageRequest);
  await stopWaitingForGptImageGeneration(user);

  await ctx.deleteMessage(messages[0].message_id);

  imageRequest = await updateImageRequest(
    imageRequest,
    {
      response: image,
      respondedAt: now()
    }
  );

  if (isSuccess(image)) {
    const url = image.url;

    console.log(url); // to debug the broken OpenAI urls

    if (!url) {
      console.error("The generated image is missing `url`.");
      await putMetric("Error");
      await putMetric("ImageHasNoUrlError");

      await reply(
        ctx,
        "Не удалось нарисовать картинку. Попробуйте еще раз."
      );

      return false;
    }

    await reply(
      ctx,
      `${symbols.picture} Ваша картинка по запросу <b>«${prompt}»</b> готова. 👇`
    );

    await ctx.replyWithPhoto(url);

    await ctx.replyWithHTML(
      toText(
        `<a href="${url}">Скачать картинку</a> в хорошем качестве.`,
        `${symbols.warning} Ссылка работает 60 минут!`
      ),
      {
        ...inlineKeyboard(
          Markup.button.url("Скачать картинку", url),
          [`Создать еще одну ${symbols.picture}`, backToStartAction],
          cancelButton
        ),
        disable_web_page_preview: true
      }
    );

    if (product) {
      product.usage = incProductUsage(
        product.usage,
        modelCode,
        usagePoints
      );

      user = await updateUserProduct(user, product);
    }

    user = await incUsage(user, pureModelCode, requestedAt);

    await putMetric("ImageGenerated");

    return true;
  } else {
    let errorMessage = image.message;

    if (errorMessage.includes("Your prompt may contain text that is not allowed by our safety system.")) {
      errorMessage = "Ваш запрос был отвергнут системой безопасности OpenAI. Попробуйте его перефразировать.";
    } else if (errorMessage.includes("This request has been blocked by our content filters.")) {
      errorMessage = "Ваш запрос был заблокирован фильтрами OpenAI. Попробуйте его перефразировать.";
    } else if (errorMessage.includes("Image descriptions generated from your prompt may contain text that is not allowed by our safety system. If you believe this was done in error, your request may succeed if retried, or by adjusting your prompt.")) {
      errorMessage = "Ваш запрос был отвергнут системой безопасности OpenAI. Если вы считаете, что это ошибка, можете попробовать повторить запрос. Иначе попробуйте его перефразировать.";
    }

    await replyWithKeyboard(
      ctx,
      inlineKeyboard(cancelButton),
      `${symbols.cross} ${errorMessage}`
    );
  }

  return false;
}

export const getDefaultImageSettings = (): ImageSettings => ({
  size: defaultImageSize
});

export const imageSettingsEqual = (settingsA: ImageSettings, settingsB: ImageSettings) =>
  settingsA.size === settingsB.size && settingsA.quality === settingsB.quality;
