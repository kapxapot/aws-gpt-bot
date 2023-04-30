import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { Money } from "../entities/money";

export interface YooMoneyPaymentData {
  total: Money;
  description: string;
}

export interface PaymentResponse {
  data: any;
}

export interface PaymentError {
  error: string;
}

export function isPaymentError(result: PaymentResponse | PaymentError): result is PaymentError {
  return "error" in result;
}

const config = {
  botUrl: process.env.BOT_URL,
  apiUrl: "https://api.yookassa.ru/v3/payments",
  shopId: process.env.YOOMONEY_SHOP_ID!,
  apiKey: process.env.YOOMONEY_API_KEY!
};

export async function yooMoneyPayment(paymentData: YooMoneyPaymentData): Promise<PaymentResponse | PaymentError> {
  const paymentRequest = {
    "amount": {
      "value": paymentData.total.amount.toFixed(2),
      "currency": paymentData.total.currency
    },
    "capture": true,
    "confirmation": {
      "type": "redirect",
      "return_url": config.botUrl
    },
    "description": paymentData.description
  };

  const idempotenceKey = uuidv4();

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

    if (axios.isAxiosError(error)) {
      const message = error.response?.data.error.message ?? error.message;

      return {
        error: `Ошибка YooMoney API: ${message}`
      };
    }

    return {
      error: "Ошибка обращения к YooMoney API."
    };
  }
}
