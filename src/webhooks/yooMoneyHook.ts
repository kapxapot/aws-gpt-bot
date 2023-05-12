import { at, ts } from "../entities/at";
import { getProductDisplayName } from "../entities/product";
import { toText } from "../lib/common";
import { addUserEvent } from "../services/userService";
import { getPayment, updatePayment } from "../storage/paymentStorage";
import { getUser } from "../storage/userStorage";
import { sendTelegramMessage } from "../telegram/bot";

export async function youMoneyHook(requestData: any) {
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

    let productName = `<b>${getProductDisplayName(product, "Acc")}</b>`;

    if (product.details.type === "subscription") {
      productName = `тариф ${productName}`;
    }

    await sendTelegramMessage(
      user,
      toText(
        `Мы успешно получили ваш платеж. Вы приобрели ${productName}.`,
        "Благодарим за покупку! ♥"
      )
    );
  }
}
