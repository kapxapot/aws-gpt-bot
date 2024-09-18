import { now } from "../entities/at";
import { Payment, PaymentEvent } from "../entities/payment";
import { PurchasableProduct } from "../entities/product";
import { User } from "../entities/user";
import { yooMoneyPayment } from "../external/yooMoneyPayment";
import { Result, isError } from "../lib/error";
import { storePayment } from "../storage/paymentStorage";

export async function createPayment(user: User, product: PurchasableProduct): Promise<Result<Payment>> {
  const requestData = {
    user,
    total: product.price,
    description: product.name
  };

  const response = await yooMoneyPayment(requestData);

  if (isError(response)) {
    return response;
  }

  const data = response.data;

  const event: PaymentEvent = {
    type: "created",
    details: data,
    at: now()
  };

  const paymentId = data.id;
  const paymentUrl = data.confirmation.confirmation_url;

  return await storePayment({
    id: paymentId,
    userId: user.id,
    type: "YooMoney",
    cart: [product],
    status: data.status,
    total: requestData.total,
    description: requestData.description,
    url: paymentUrl,
    requestData: requestData,
    responseData: data,
    events: [event]
  });
}
