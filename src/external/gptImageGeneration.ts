import axios from "axios";
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
  try {
    const response = await openai.images.generate(
      {
        model: imageRequest.model,
        prompt: imageRequest.prompt.substring(0, config.maxImagePromptLength),
        n: 1,
        size: imageRequest.size,
        quality: imageRequest.quality
      },
      {
        timeout: config.gptTimeout
      }
    );

    return response.data[0];
  } catch (error) {
    console.error(error);

    if (axios.isAxiosError(error)) {
      const message = error.response?.data.error.message ?? error.message;

      return new Error(`Ошибка OpenAI API: ${message}`);
    }

    return new Error("Ошибка обращения к OpenAI API.");
  }
}
