import { TextModel, ImageModel, ImageSettings } from "./model";

type TextPrice = {
  inputPrice: number;
  outputPrice: number;
  avgPrice: number;
};

type ImagePrice = {
  settings: ImageSettings;
  price: number;
}

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
