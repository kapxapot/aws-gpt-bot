import { Image } from "openai/resources/images.mjs";
import { Result } from "../lib/error";
import { ImageModel, ImageQuality, ImageResponseFormat, ImageSize } from "../lib/openai";
import { Entity } from "../lib/types";
import { At } from "./at";

export type ImageRequest = Entity & {
  userId: string;
  model: ImageModel;
  quality?: ImageQuality;
  size: ImageSize;
  prompt: string;
  strict: boolean;
  responseFormat: ImageResponseFormat;
  response?: Result<Image>;
  requestedAt: At;
  respondedAt?: At;
};
