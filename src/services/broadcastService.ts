import { now } from "../entities/at";
import { BroadcastMessage } from "../entities/broadcastMessage";
import { BroadcastRequest } from "../entities/broadcastRequest";
import { toText } from "../lib/common";
import { storeBroadcastMessage, updateBroadcastMessage } from "../storage/broadcastMessageStorage";
import { getAllUsers, getUser } from "../storage/userStorage";
import { sendTelegramMessage } from "../telegram/bot";
import { putMetric } from "./metricService";

/**
 * Adds broadcast messages for all users.
 */
export async function processBroadcastRequest(request: BroadcastRequest) {
  const message = toText(...request.messages);
  const users = await getAllUsers();

  for (const user of users) {
    if (request.users && !request.users.some(uid => uid === user.id)) {
      continue;
    }

    await storeBroadcastMessage(user, message, request.isTest);
  };
}

export async function sendBroadcastMessage(broadcastMessage: BroadcastMessage) {
  const userId = broadcastMessage.userId;

  if (!userId) {
    console.log("Unable to broadcast a message, user id is undefined.");
    return;
  }

  const user = await getUser(userId);

  if (!user) {
    console.log(`User ${userId} was not found.`);
    return;
  }

  try {
    const isTest = broadcastMessage.isTest;

    if (isTest) {
      await sendTelegramMessage(user, broadcastMessage.message);
    }

    await updateBroadcastMessage(
      broadcastMessage,
      {
        sentAt: now(),
        sendResult: {
          status: isTest ? "test" : "success"
        }
      }
    );

    await putMetric("BroadcastMessageSent");
  } catch (error) {
    // what happens here is one of:
    // - "Forbidden: bot was blocked by the user"
    // - "Forbidden: user is deactivated"
    // it can be used to detect that the bot was blocked by the user
    // currently, it's not used but could be helpful to update the user status
    console.error(error);

    await updateBroadcastMessage(
      broadcastMessage,
      {
        sentAt: now(),
        sendResult: {
          status: "fail",
          error
        }
      }
    );

    await putMetric("BroadcastMessageFailed");
  }
}
