import OpenAI from "openai";
import { gptTimeout } from "../services/gptService";
import { settings } from "../lib/constants";
import { Result } from "../lib/error";
import { ImageRequest } from "../entities/imageRequest";
import { Image } from "openai/resources/images.mjs";

const config = {
  gptTimeout: gptTimeout * 1000,
  maxImagePromptLength: settings.maxImagePromptLength
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function gptImageGeneration(imageRequest: ImageRequest): Promise<Result<Image>> {
  const prompt = imageRequest.strict
    ? `I NEED to test how the tool works with extremely simple prompts. DO NOT add any detail, just use it AS-IS: ${imageRequest.prompt}`
    : imageRequest.prompt;

  try {
    const response = await openai.images.generate(
      {
        model: imageRequest.model,
        prompt: prompt.substring(0, config.maxImagePromptLength),
        n: 1,
        size: imageRequest.size,
        quality: imageRequest.quality,
        response_format: imageRequest.responseFormat
      },
      {
        timeout: config.gptTimeout
      }
    );

    return response.data[0];
  } catch (error) {
    console.error(error);

    if (error.error && error.error.message) {
      const message = error.error.message;

      return new Error(`Ошибка OpenAI API: ${message}`);
    }

    return new Error("Ошибка обращения к OpenAI API.");
  }
}
