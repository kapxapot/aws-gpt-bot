import { now } from "../entities/at";
import { User } from "../entities/user";
import { gptImageGeneration } from "../external/gptImageGeneration";
import { toText } from "../lib/common";
import { cancelButton } from "../lib/dialog";
import { isSuccess } from "../lib/error";
import { inlineKeyboard, reply, replyWithKeyboard } from "../lib/telegram";
import { storeImageRequest, updateImageRequest } from "../storage/imageRequestStorage";
import { AnyContext } from "../telegram/botContext";
import { putMetric } from "./metricService";
import { getUserPlanSettings, stopWaitingForGptImageGeneration, waitForGptImageGeneration } from "./userService";
import { PassThrough } from "stream";

export async function generateImageWithGpt(ctx: AnyContext, user: User, prompt: string): Promise<boolean> {
  const requestedAt = now();

  const messages = await reply(ctx, "👨‍🎨 Рисую вашу картинку, подождите... ⏳");

  const planSettings = getUserPlanSettings(user);

  let imageRequest = await storeImageRequest({
    userId: user.id,
    model: planSettings.images.model,
    size: planSettings.images.size,
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
