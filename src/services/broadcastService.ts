import { now } from "../entities/at";
import { BroadcastMessage } from "../entities/broadcastMessage";
import { BroadcastRequest } from "../entities/broadcastRequest";
import { User } from "../entities/user";
import { isEmpty, isUndefined, toText } from "../lib/common";
import { findBroadcastMessages, storeBroadcastMessage, updateBroadcastMessage } from "../storage/broadcastMessageStorage";
import { getBroadcastRequest } from "../storage/broadcastRequestStorage";
import { getAllUsers } from "../storage/userStorage";
import { sendTelegramMessage } from "../telegram/bot";
import { putMetric } from "./metricService";
import { getUserById } from "./userService";

/**
 * Adds broadcast messages for all users.
 */
export async function processBroadcastRequest(request: BroadcastRequest) {
  const users = await getAllUsers();

  const resumeRequestId = request.resumeRequestId;

  if (!resumeRequestId) {
    // normal run
    await createBroadcastMessages(request, users);
    return;
  }

  // resume run
  const resumeRequest = await getBroadcastRequest(resumeRequestId);

  if (!resumeRequest) {
    console.error(`The broadcast request to resume not found: ${resumeRequestId}`);
    return;
  }

  const existingMessages = await findBroadcastMessages(resumeRequest);
  const alreadyProcessedUserIds = existingMessages.map(m => m.userId);
  const remainingUsers = users.filter(u => !alreadyProcessedUserIds.includes(u.id));

  console.log(`Total users: ${users.length}, already processed users: ${alreadyProcessedUserIds.length}, remaining users: ${remainingUsers.length}.`);

  // we let the new request to override the `isTest` value of the resume request
  await createBroadcastMessages(resumeRequest, remainingUsers, request.isTest);
}

export async function sendBroadcastMessage(broadcastMessage: BroadcastMessage) {
  const userId = broadcastMessage.userId;

  try {
    const user = await getUserById(userId);

    if (!user) {
      throw new Error(`User ${userId} not found.`);
    }

    const isTest = broadcastMessage.isTest;

    if (!isTest) {
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
    // - user not found
    // - "Forbidden: bot was blocked by the user"
    // - "Forbidden: user is deactivated"
    // the last two can be used to detect that the bot was blocked by the user
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

async function createBroadcastMessages(
  request: BroadcastRequest,
  users: User[],
  isTest?: boolean
): Promise<void> {
  const requestUsers = request.users;

  const usersToBroadcast = requestUsers && !isEmpty(requestUsers)
    ? users.filter(user => requestUsers.some(uid => uid === user.id))
    : users;

  let count = 0;

  for (const user of usersToBroadcast) {
    await storeBroadcastMessage(
      request,
      user,
      toText(...request.messages ?? []),
      isUndefined(isTest) ? request.isTest : isTest
    );

    console.log(`[${++count}/${usersToBroadcast.length}] Created a broadcast message.`);
  }
}
