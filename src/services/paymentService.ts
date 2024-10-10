import { PreCheckoutQuery, SuccessfulPayment } from "telegraf/types";
import { at, At, now, ts } from "../entities/at";
import { Money } from "../entities/money";
import { Payment, PaymentEvent, PaymentType, TelegramStarsPayment, YooMoneyPayment } from "../entities/payment";
import { PaymentProduct, PurchasableProduct } from "../entities/product";
import { User } from "../entities/user";
import { yooMoneyPayment } from "../external/yooMoneyPayment";
import { Result, isError } from "../lib/error";
import { Timestampless } from "../lib/types";
import { uuid } from "../lib/uuid";
import { getPayment, storePayment, updatePayment } from "../storage/paymentStorage";
import { BotContext } from "../telegram/botContext";
import { formatProductName, getPrettyProductName, productToPurchasedProduct } from "./productService";
import { currencyToMetric, putMetric } from "./metricService";
import { addUserProduct, getUserById } from "./userService";
import { sendTelegramMessage } from "../telegram/bot";
import { t } from "../lib/translate";
import { YooMoneyEventData } from "../functions/apiHandlers/yooMoneyHandler";

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
      type: "pending",
      details: data,
      at: now()
    }]
  };

  return await storePayment(payment) as YooMoneyPayment;
}

export async function processYooMoneySuccessfulPayment(data: YooMoneyEventData) {
  let payment = await getPaymentById(data.id, "YooMoney");

  if (!payment) {
    return;
  }

  const paidAt = at(ts(data.captured_at));

  payment = await addPaymentEvent(payment, {
    type: "succeeded",
    details: data,
    at: paidAt
  });

  await addPaymentProductsToUser(payment, paidAt);
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
    status: "",
    total: purchasePrice,
    events: [{
      type: "pending",
      at: now()
    }]
  };

  return await storePayment(payment) as TelegramStarsPayment;
}

export async function processTelegramStarsPreCheckout(ctx: BotContext, query: PreCheckoutQuery) {
  await ctx.answerPreCheckoutQuery(true);

  const payment = await getPaymentById(query.invoice_payload, "TelegramStars");

  if (!payment) {
    return;
  }

  await addPaymentEvent(payment, {
    type: "preCheckout",
    details: query,
    at: now()
  });
}

export async function processTelegramStarsSuccessfulPayment(
  ctx: BotContext,
  successfulPayment: SuccessfulPayment
) {
  await ctx.answerPreCheckoutQuery(true);

  let payment = await getPaymentById(
    successfulPayment.invoice_payload,
    "TelegramStars"
  );

  if (!payment) {
    return;
  }

  const at = now();

  payment = await addPaymentEvent(payment, {
    type: "succeeded",
    details: successfulPayment,
    at
  });

  await addPaymentProductsToUser(payment, at);
}

export async function getPaymentById(id: string, type: PaymentType): Promise<Payment | null> {
  const payment = await getPayment(id);

  if (payment) {
    return payment;
  }

  console.error(`${type} payment ${id} not found.`);

  await putMetric("Error");
  await putMetric("PaymentNotFoundError");

  return null;
}

export async function addPaymentEvent(payment: Payment, event: PaymentEvent): Promise<Payment> {
  const events = [
    ...payment.events,
    event
  ];

  return await updatePayment(
    payment,
    {
      status: event.type,
      events
    }
  );
}

export async function addPaymentProductsToUser(payment: Payment, paidAt: At) {
  let user = await getUserById(payment.userId);

  if (!user) {
    console.error(`Payment user ${payment.userId} not found.`);
    await putMetric("Error");
    await putMetric("PaymentUserNotFoundError");

    return;
  }

  for (const product of payment.cart) {
    const purchasedProduct = productToPurchasedProduct(product, paidAt);
    user = await addUserProduct(user, purchasedProduct);

    await addPaymentMetrics(product);

    const productName = formatProductName(user, purchasedProduct, "Accusative");

    await sendTelegramMessage(
      user,
      t(user, "paymentReceived", { productName })
    );
  }
}

async function addPaymentMetrics(product: PaymentProduct): Promise<void> {
  await putMetric("PaymentReceived");

  const { currency, amount } = product.purchasePrice;
  const metric = currencyToMetric(currency);

  await putMetric(metric, amount);
}
