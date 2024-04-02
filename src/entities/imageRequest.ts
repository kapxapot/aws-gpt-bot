import { Image } from "openai/resources/images.mjs";
import { Result } from "../lib/error";
import { Entity } from "../lib/types";
import { At } from "./at";
import { ImageModel, ImageQuality, ImageResponseFormat, ImageSize } from "./model";

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
