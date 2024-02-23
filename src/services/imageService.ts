import { now } from "../entities/at";
import { User } from "../entities/user";
import { gptImageGeneration } from "../external/gptImageGeneration";
import { isSuccess } from "../lib/error";
import { reply } from "../lib/telegram";
import { storeImageRequest, updateImageRequest } from "../storage/imageRequestStorage";
import { AnyContext } from "../telegram/botContext";
import { putMetric } from "./metricService";
import { getUserPlanSettings } from "./planService";
import { stopWaitingForGptImageGeneration, waitForGptImageGeneration } from "./userService";

export async function generateImageWithGpt(ctx: AnyContext, user: User, prompt: string) {
  const requestedAt = now();

  const messages = await reply(ctx, "👨‍🎨 Рисую вашу картинку, подождите... ⏳");

  const planSettings = getUserPlanSettings(user);

  let imageRequest = await storeImageRequest({
    userId: user.id,
    model: planSettings.images.model,
    size: planSettings.images.size,
    prompt,
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
    await reply(
      ctx,
      `Ваша картинка по запросу «${prompt}» готова:`,
      image.url!
    );
  } else {
    const errorMessage = image.message;

    await reply(ctx, `❌ ${errorMessage}`);
  }

  if (isSuccess(image)) {
    await putMetric("ImageGenerated");
  }
}
