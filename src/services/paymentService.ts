import { now } from "../entities/at";
import { Money } from "../entities/money";
import { TelegramStarsPayment, YooMoneyPayment } from "../entities/payment";
import { PurchasableProduct } from "../entities/product";
import { User } from "../entities/user";
import { yooMoneyPayment } from "../external/yooMoneyPayment";
import { Result, isError } from "../lib/error";
import { Timestampless } from "../lib/types";
import { uuid } from "../lib/uuid";
import { storePayment } from "../storage/paymentStorage";
import { getPrettyProductName } from "./productService";

export async function createYooMoneyPayment(
  user: User,
  product: PurchasableProduct,
  purchasePrice: Money
): Promise<Result<YooMoneyPayment>> {
  const requestData = {
    user,
    total: purchasePrice,
    description: getPrettyProductName(user, product, { full: true })
  };

  const response = await yooMoneyPayment(requestData);

  if (isError(response)) {
    return response;
  }

  const data = response.data;

  const payment: Timestampless<YooMoneyPayment> = {
    id: data.id,
    userId: user.id,
    type: "YooMoney",
    cart: [{
      ...product,
      purchasePrice
    }],
    status: data.status,
    total: requestData.total,
    description: requestData.description,
    url: data.confirmation.confirmation_url,
    requestData: requestData,
    responseData: data,
    events: [{
      type: "created",
      details: data,
      at: now()
    }]
  };

  return await storePayment(payment) as YooMoneyPayment;
}

export async function createTelegramStarsPayment(
  user: User,
  product: PurchasableProduct,
  purchasePrice: Money
): Promise<TelegramStarsPayment> {
  const payment: Timestampless<TelegramStarsPayment> = {
    id: uuid(),
    userId: user.id,
    type: "TelegramStars",
    cart: [{
      ...product,
      purchasePrice
    }],
    total: purchasePrice,
    events: [{
      type: "created",
      at: now()
    }]
  };

  return await storePayment(payment) as TelegramStarsPayment;
}
