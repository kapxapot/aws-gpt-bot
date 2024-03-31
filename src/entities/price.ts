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

const gptokenPrice: Money = {
  amount: 0.02,
  currency: "USD"
};

function gptokens(count: number): Money {
  return {
    amount: gptokenPrice.amount * count,
    currency: gptokenPrice.currency
  };
}

export const textPrices: Record<GptModel, TextPrice> = {
  "gpt-3.5-turbo-0125": {
    inputPrice: gptokens(0.025), // 0.0005
    outputPrice: gptokens(0.075) // 0.0015
  },
  "gpt-4-0125-preview": {
    inputPrice: gptokens(0.5), // 0.01
    outputPrice: gptokens(1.5) // 0.03
  }
};

export const imagePrices: Record<ImageModel, ImagePrice[]> = {
  "dall-e-3": [
    {
      size: "1024x1024",
      price: gptokens(2) // 0.04
    },
    {
      size: "1024x1792",
      price: gptokens(4) // 0.08
    },
    {
      size: "1792x1024",
      price: gptokens(4) // 0.08
    },
    {
      size: "1024x1024",
      quality: "hd",
      price: gptokens(4) // 0.08
    },
    {
      size: "1024x1792",
      quality: "hd",
      price: gptokens(6) // 0.12
    },
    {
      size: "1792x1024",
      quality: "hd",
      price: gptokens(6) // 0.12
    },
  ]
};
