import { Image } from "openai/resources/images.mjs";
import { Result } from "../lib/error";
import { Entity } from "../lib/types";
import { At } from "./at";
import { ImageModel, ImageResponseFormat, ImageSettings } from "./model";

export type ImageRequest = Entity & ImageSettings & {
  userId: string;
  model: ImageModel;
  prompt: string;
  strict: boolean;
  responseFormat: ImageResponseFormat;
  response?: Result<Image>;
  requestedAt: At;
  respondedAt?: At;
};
