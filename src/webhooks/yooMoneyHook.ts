import { at, ts } from "../entities/at";
import { getProductDisplayName } from "../entities/product";
import { isDebugMode, toText } from "../lib/common";
import { addUserEvent } from "../services/userService";
import { getPayment, updatePayment } from "../storage/payments";
import { getUser } from "../storage/users";
import { sendTelegramMessage } from "../telegram/bot";

export async function youMoneyHook(requestData: any) {
  if (isDebugMode()) {
    console.log(requestData);
  }

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
  const payedAt = at(ts(data.captured_at));

  events.push({
    type: "succeeded",
    details: data,
    at: payedAt
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
        at: payedAt
      }
    );

    await sendTelegramMessage(
      user,
      toText(
        `Мы успешно получили ваш платеж. Вы приобрели <b>${getProductDisplayName(product, "Acc")}</b>.`,
        "Благодарим за покупку! ♥"
      )
    );
  }
}
