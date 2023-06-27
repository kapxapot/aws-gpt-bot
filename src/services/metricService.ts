import { CloudWatchClient, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";

export type MetricName = "MessageSent" | "TokensUsed" | "UserRegistered" | "UsersTotal";

const config = {
  env: process.env.ENV,
  namespace: "GPToid"
};

export async function putMetric(name: MetricName, value: number): Promise<void> {
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
