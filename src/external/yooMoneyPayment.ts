import axios from "axios";
import { v4 as uuid } from "uuid";
import { Money } from "../entities/money";
import { Result } from "../lib/error";
import { putMetric } from "../services/metricService";
import { User } from "../entities/user";
import { phoneToItu } from "../lib/common";

export type YooMoneyPaymentData = {
  user: User;
  total: Money;
  description: string;
};

export type PaymentResponse = {
  data: {
    id: string;
    status: string;
    confirmation: {
      confirmation_url: string;
    }
  };
};

const config = {
  botUrl: process.env.BOT_URL,
  apiUrl: "https://api.yookassa.ru/v3/payments",
  shopId: process.env.YOOMONEY_SHOP_ID!,
  apiKey: process.env.YOOMONEY_API_KEY!
};

export async function yooMoneyPayment(paymentData: YooMoneyPaymentData): Promise<Result<PaymentResponse>> {
  const user = paymentData.user;
  const phoneNumber = phoneToItu(user.phoneNumber);

  if (!phoneNumber) {
    const error = new Error(`У пользователя ${user.id} отсутствует номер телефона.`);

    console.error(error);
    await putMetric("Error");
    await putMetric("EmptyUserPhoneNumberError");

    return error;
  }

  const totalAmount = paymentData.total.amount.toFixed(2);
  const totalCurrency = paymentData.total.currency;

  const paymentRequest = {
    "amount": {
      "value": totalAmount,
      "currency": totalCurrency
    },
    "capture": true,
    "confirmation": {
      "type": "redirect",
      "return_url": config.botUrl
    },
    "description": paymentData.description,
    "receipt": {
      "customer": {
        "phone": phoneNumber
      },
      "items": [
        {
          "description": paymentData.description,
          "quantity": "1",
          "amount": {
            "value": totalAmount,
            "currency": totalCurrency
          },
          "vat_code": "1"
        }
      ]
    }
  };

  const idempotenceKey = uuid();

  try {
    const response = await axios.post(
      config.apiUrl,
      paymentRequest,
      {
        headers: {
          "Idempotence-Key": idempotenceKey,
          "Content-Type": "application/json"
        },
        auth: {
          username: config.shopId,
          password: config.apiKey
        }
      }
    );

    return {
      data: response.data
    };
  } catch (error) {
    console.error(error);
    await putMetric("Error");
    await putMetric("YooMoneyError");

    if (axios.isAxiosError(error)) {
      let errorMessage = "Ошибка YooMoney API";

      try {
        const message = error.response?.data?.error?.message
          ?? error.response?.data?.description
          ?? error.message;

        errorMessage += `: ${message}`;
      } catch { /* empty */ }

      return new Error(errorMessage);
    }

    return new Error("Ошибка обращения к YooMoney API.");
  }
}
