import { at, ts } from "../entities/at";
import { toText } from "../lib/common";
import { putMetric } from "../services/metricService";
import { getProductFullDisplayName } from "../services/productService";
import { addUserEvent } from "../services/userService";
import { getPayment, updatePayment } from "../storage/paymentStorage";
import { getUser } from "../storage/userStorage";
import { sendTelegramMessage } from "../telegram/bot";

type YouMoneyRequestData = {
  event: string;
  object: {
    id: string;
    captured_at: string;
    status: string;
  };
};

export async function youMoneyHook(requestData: YouMoneyRequestData) {
  const event = requestData.event;

  if (event !== "payment.succeeded") {
    return;
  }

  const data = requestData.object;

  // get the payment
  const paymentId = data.id;
  let payment = await getPayment(paymentId);

  if (!payment) {
    console.error(`YooMoney payment ${paymentId} not found.`);
    await putMetric("Error");
    await putMetric("PaymentNotFoundError");

    return;
  }

  // add new event to the payment
  // update the payment status to "succeeded"
  const events = payment.events;
  const paidAt = at(ts(data.captured_at));

  events.push({
    type: "succeeded",
    details: data,
    at: paidAt
  });

  payment = await updatePayment(
    payment,
    {
      status: data.status,
      events
    }
  );

  // add an event(s) to the user
  const user = await getUser(payment.userId);

  if (!user) {
    console.error(`Payment user ${payment.userId} not found.`);
    await putMetric("Error");
    await putMetric("PaymentUserNotFoundError");

    return;
  }

  for (const product of payment.cart) {
    await addUserEvent(
      user,
      {
        type: "purchase",
        details: product,
        at: paidAt
      }
    );

    const productName = getProductFullDisplayName(product, "Accusative");

    await sendTelegramMessage(
      user,
      toText(
        `Мы успешно получили ваш платеж. Вы приобрели ${productName}.`,
        "Благодарим за покупку! ♥"
      )
    );
  }
}
