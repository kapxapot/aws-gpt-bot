import { TextModel, ImageModel, ImageSettings } from "./model";

/**
 * Prices in gptokens per 1000 tokens. One gptoken = $0.02.
 */
type TextPrice = {
  inputPrice: number;
  outputPrice: number;
  avgPrice: number;
};

/**
 * Prices in gptokens per 1 image. One gptoken = $0.02.
 */
type ImagePrice = {
  settings: ImageSettings;
  price: number;
}

// const gptokenPrice = money(0.02, "USD");

export const textPrices: Record<TextModel, TextPrice> = {
  "gpt-3.5-turbo": {
    inputPrice: 0.025, // $0.0005
    outputPrice: 0.075, // $0.0015
    avgPrice: 0.05
  },
  "gpt-4-turbo": {
    inputPrice: 0.5, // $0.01
    outputPrice: 1.5, // $0.03
    avgPrice: 1
  },
  "gpt-4o": {
    inputPrice: 0.25, // $0.005
    outputPrice: 0.75, // $0.015
    avgPrice: 0.5
  },
  "gpt-4o-mini": {
    inputPrice: 0.0075, // $0.00015
    outputPrice: 0.03, // $0.0006
    avgPrice: 0.01875 // $0.000375
  }
};

export const imagePrices: Record<ImageModel, ImagePrice[]> = {
  "dall-e-3": [
    {
      settings: {
        size: "1024x1024"
      },
      price: 2 // $0.04
    },
    {
      settings: {
        size: "1024x1792"
      },
      price: 4 // $0.08
    },
    {
      settings: {
        size: "1792x1024"
      },
      price: 4 // $0.08
    },
    {
      settings: {
        size: "1024x1024",
        quality: "hd"
      },
      price: 4 // $0.08
    },
    {
      settings: {
        size: "1024x1792",
        quality: "hd"
      },
      price: 6 // $0.12
    },
    {
      settings: {
        size: "1792x1024",
        quality: "hd"
      },
      price: 6 // $0.12
    },
  ]
};
