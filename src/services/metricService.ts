import { CloudWatchClient, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";

export type MetricName =
  "MessageSent"
  | "TokensUsed"
  | "UserRegistered"
  | "UsersTotal"
  | "BroadcastMessageSent"
  | "BroadcastMessageFailed"
  | "ImageGenerated";

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
