import { CloudWatchClient, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";
import { Currency } from "../entities/currency";

export type MetricName =
  "MessageSent" |
  "TokensUsed" |
  "UserRegistered" |
  "UserRegisteredByInvite" |
  "UsersTotal" |
  "BroadcastMessageSent" |
  "BroadcastMessageFailed" |
  "ImageGenerated" |
  "PaymentReceived" |
  "RUBAmountReceived" |
  "USDAmountReceived" |
  "EURAmountReceived" |
  "XTRAmountReceived" |
  "CouponIssued" |
  "CouponActivated" |
  "Error" |
  "PaymentUserNotFoundError" |
  "PaymentNotFoundError" |
  "ApiProcessingError" |
  "YooMoneyError" |
  "OpenAiError" |
  "UserNotFoundError" |
  "EmptyUserPhoneNumberError" |
  "ImageHasNoUrlError";

const currencyMetrics: Record<Currency, MetricName> = {
  RUB: "RUBAmountReceived",
  USD: "USDAmountReceived",
  EUR: "EURAmountReceived",
  XTR: "XTRAmountReceived"
};

const config = {
  env: process.env.ENV,
  namespace: "GPToid"
};

export async function putMetric(name: MetricName, value: number = 1): Promise<void> {
  const client = new CloudWatchClient({});

  const command = new PutMetricDataCommand({
      MetricData: [{
          MetricName: name,
          Dimensions: [{
              Name: "Environment",
              Value: config.env,
          }],
          Unit: "None",
          Timestamp: new Date(),
          Value: value
      }],
      Namespace: config.namespace
  });

  await client.send(command);
}

export const currencyToMetric = (currency: Currency) => currencyMetrics[currency]
