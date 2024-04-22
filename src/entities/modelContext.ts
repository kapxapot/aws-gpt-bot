import { At } from "./at";
import { ImageModel, ImageModelCode, ImageSettings, PureImageModelCode, PureTextModelCode, TextModel, TextModelCode } from "./model";
import { PurchasedProduct } from "./product";

type ModelContext = {
  product: PurchasedProduct | null;
  lastUsedAt: At | null;
};

export type TextModelContext = ModelContext & {
  modelCode: TextModelCode;
  pureModelCode: PureTextModelCode;
  model: TextModel;
};

export type ImageModelContext = ModelContext & {
  modelCode: ImageModelCode;
  pureModelCode: PureImageModelCode;
  model: ImageModel;
  imageSettings: ImageSettings;
  usagePoints: number;
};
