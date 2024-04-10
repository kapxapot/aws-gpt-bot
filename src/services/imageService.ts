import { now } from "../entities/at";
import { ImageModelCode, ImageQuality, ImageSize, defaultImageModelCode, defaultImageSize } from "../entities/model";
import { User } from "../entities/user";
import { gptImageGeneration } from "../external/gptImageGeneration";
import { getCaseByNumber } from "./grammarService";
import { commatize, toText } from "../lib/common";
import { commands } from "../lib/constants";
import { cancelButton } from "../lib/dialog";
import { isSuccess } from "../lib/error";
import { inlineKeyboard, reply, replyWithKeyboard } from "../lib/telegram";
import { storeImageRequest, updateImageRequest } from "../storage/imageRequestStorage";
import { AnyContext } from "../telegram/botContext";
import { happened, timeLeft } from "./dateService";
import { gptTimeout } from "./gptService";
import { putMetric } from "./metricService";
import { getLastUsedAt, incUsage, isUsageLimitExceeded } from "./usageStatsService";
import { getUserActiveProduct, stopWaitingForGptImageGeneration, updateUserProduct, waitForGptImageGeneration } from "./userService";
import { PassThrough } from "stream";
import { getAvailableImageModel } from "./productService";
import { getImageModelByCode, purifyImageModelCode } from "./modelService";
import { incProductUsage } from "./productUsageService";
import { getImageModelUsagePoints } from "./modelUsageService";
import { getUsageReport } from "./usageService";
import { getModeName } from "../entities/prompt";
import { isDebugMode } from "./userSettingsService";

const config = {
  imageInterval: parseInt(process.env.IMAGE_INTERVAL ?? "60") * 1000, // milliseconds
};

export async function generateImageWithGpt(ctx: AnyContext, user: User, prompt: string): Promise<boolean> {
  const requestedAt = now();
  const activeProduct = getUserActiveProduct(user);

  const productModelCode = activeProduct
    ? getAvailableImageModel(activeProduct)
    : null;

  const usingProduct = activeProduct && productModelCode;

  const modelCode = productModelCode ?? defaultImageModelCode;
  const pureModelCode = purifyImageModelCode(modelCode);
  const model = getImageModelByCode(modelCode);

  const lastUsedAt = getLastUsedAt(user.usageStats, pureModelCode);

  if (user.waitingForGptImageGeneration) {
    if (lastUsedAt && happened(lastUsedAt.timestamp, gptTimeout * 1000)) {
      // we have waited enough for the GPT answer
      await stopWaitingForGptImageGeneration(user);
    } else {
      await reply(ctx, "Ваша предыдущая картинка еще не готова, подождите... ⏳");
      return false;
    }
  }

  // we check the user's usage stats if we don't use a product,
  // but fall back to the defaults
  if (!usingProduct) {
    if (isUsageLimitExceeded(user, pureModelCode, "day")) {
      await reply(
        ctx,
        "Вы превысили лимит генерации картинок на сегодня. 😥",
        `Подождите до завтра или перейдите на тариф с более высоким лимитом: /${commands.premium}`
      );
  
      return false;
    }

    if (isUsageLimitExceeded(user, pureModelCode, "week")) {
      await reply(
        ctx,
        "Вы превысили лимит генерации картинок на эту неделю. 😥😥",
        `Подождите следующей недели или перейдите на тариф с более высоким лимитом: /${commands.premium}`
      );
  
      return false;
    }

    if (isUsageLimitExceeded(user, pureModelCode, "month")) {
      await reply(
        ctx,
        "Вы превысили лимит генерации картинок на этот месяц. 😥😥😥",
        `Подождите следующего месяца или перейдите на тариф с более высоким лимитом: /${commands.premium}`
      );
  
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
        `Вы отправляете запросы слишком часто. Подождите ${seconds} ${getCaseByNumber("секунда", seconds)}... ⏳`
      );

      return false;
    }
  }

  const messages = await reply(ctx, "👨‍🎨 Рисую вашу картинку, подождите... ⏳");

  const imageSize: ImageSize = defaultImageSize;
  const imageQuality: ImageQuality | undefined = undefined;

  let imageRequest = await storeImageRequest({
    userId: user.id,
    model,
    size: imageSize,
    quality: imageQuality,
    prompt,
    responseFormat: "url",
    requestedAt,
    strict: false
  });

  await waitForGptImageGeneration(user);
  const image = await gptImageGeneration(imageRequest);
  await stopWaitingForGptImageGeneration(user);

  await ctx.deleteMessage(messages[0].message_id);

  // this doesn't work for "b64_json" format
  imageRequest = await updateImageRequest(
    imageRequest,
    {
      response: image,
      respondedAt: now()
    }
  );

  if (isSuccess(image)) {
    await reply(
      ctx,
      `🖼 Ваша картинка по запросу <b>«${prompt}»</b> готова. 👇`
    );

    if (image.url) {
      await ctx.replyWithPhoto(image.url);

      await ctx.replyWithHTML(
        toText(
          `Вы также можете <a href="${image.url}">скачать картинку</a> в максимальном качестве.`,
          "⚠ Внимание! Эта ссылка будет работать только 60 минут!"
        ),
        { 
          disable_web_page_preview: true 
        }
      );
    } else if (image.b64_json) {
      const stream = new PassThrough();
      stream.write(image.b64_json);
      stream.end();

      await ctx.replyWithPhoto({ source: stream });
    }

    if (usingProduct) {
      const usagePoints = getImageModelUsagePoints(modelCode, imageSize, imageQuality);

      activeProduct.usage = incProductUsage(
        activeProduct.usage,
        modelCode,
        usagePoints
      );

      user = await updateUserProduct(user, activeProduct);
    }

    user = await incUsage(user, pureModelCode, requestedAt);

    const usageReport = getUsageReport(
      user,
      modelCode,
      pureModelCode,
      usingProduct ? activeProduct : null
    );
  
    const info = buildInfo(
      user,
      modelCode,
      usageReport
    );
  
    await reply(ctx, info);
  
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
      `❌ ${errorMessage}`
    );
  }

  return false;
}

function buildInfo(
  user: User,
  modelCode: ImageModelCode,
  usageReport: string | null
) {
  const model = getImageModelByCode(modelCode);
  const chunks: string[] = [];

  chunks.push(`📌 Режим: <b>${getModeName(user)}</b>`);

  if (isDebugMode(user)) {
    chunks.push(`модель запроса: ${model}`);
  }

  if (usageReport) {
    chunks.push(usageReport);
  }

  return commatize(chunks);
}
