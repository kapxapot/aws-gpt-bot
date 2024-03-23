import { GptModel, ImageModel, ImageQuality, ImageSize } from "./model";
import { Money } from "./money";

type TextPrice = {
  inputPrice: Money;
  outputPrice: Money;
};

type ImagePrice = {
  size: ImageSize;
  quality?: ImageQuality;
  price: Money;
}

export const textPrices: Record<GptModel, TextPrice> = {
  "gpt-3.5-turbo-0125": {
    inputPrice: {
      amount: 0.0005,
      currency: "USD"
    },
    outputPrice: {
      amount: 0.0015,
      currency: "USD"
    }
  },
  "gpt-4-0125-preview": {
    inputPrice: {
      amount: 0.01,
      currency: "USD"
    },
    outputPrice: {
      amount: 0.03,
      currency: "USD"
    }
  }
};

export const imagePrices: Record<ImageModel, ImagePrice[]> = {
  "dall-e-3": [
    {
      size: "1024x1024",
      price: {
        amount: 0.04,
        currency: "USD"
      }
    },
    {
      size: "1024x1792",
      price: {
        amount: 0.08,
        currency: "USD"
      }
    },
    {
      size: "1792x1024",
      price: {
        amount: 0.08,
        currency: "USD"
      }
    },
    {
      size: "1024x1024",
      quality: "hd",
      price: {
        amount: 0.08,
        currency: "USD"
      }
    },
    {
      size: "1024x1792",
      quality: "hd",
      price: {
        amount: 0.12,
        currency: "USD"
      }
    },
    {
      size: "1792x1024",
      quality: "hd",
      price: {
        amount: 0.12,
        currency: "USD"
      }
    },
  ]
};
