import { processYooMoneySuccessfulPayment } from "../../services/paymentService";

export type YooMoneyEventData = {
  id: string;
  captured_at: string;
  status: string;
};

type YooMoneyRequestData = {
  event: string;
  object: YooMoneyEventData;
};

export async function yooMoneyHandler(requestData: YooMoneyRequestData) {
  const event = requestData.event;

  if (event !== "payment.succeeded") {
    return;
  }

  await processYooMoneySuccessfulPayment(requestData.object);
}
