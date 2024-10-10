import { now } from "../entities/at";
import { BroadcastMessage, BroadcastSuccessStatus } from "../entities/broadcastMessage";
import { BroadcastRequest, BroadcastRequestMessages, Messages, MultilingualMessages } from "../entities/broadcastRequest";
import { User } from "../entities/user";
import { isEmpty, isUndefined } from "../lib/common";
import { isError } from "../lib/error";
import { text } from "../lib/text";
import { Language } from "../lib/types";
import { findBroadcastMessages, storeBroadcastMessage, updateBroadcastMessage } from "../storage/broadcastMessageStorage";
import { getBroadcastRequest } from "../storage/broadcastRequestStorage";
import { getAllUsers } from "../storage/userStorage";
import { sendTelegramMessage } from "../telegram/bot";
import { putMetric } from "./metricService";
import { getUserById, getUserLanguage } from "./userService";

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
  const user = await getUserById(userId);

  if (!user) {
    await broadcastFailed(broadcastMessage, `User ${userId} not found.`);
    return;
  }

  if (broadcastMessage.isTest) {
    await broadcastSucceeded(broadcastMessage, "test");
    return;
  }

  const sendResult = await sendTelegramMessage(user, broadcastMessage.message);

  if (isError(sendResult)) {
    await broadcastFailed(broadcastMessage, sendResult);
  } else {
    await broadcastSucceeded(broadcastMessage, "success");
  }
}

export function getMessages(
  messages: BroadcastRequestMessages | undefined,
  language: Language
): Messages {
  if (!messages) {
    return [];
  }

  return isMultilingualMessages(messages)
    ? messages[language] ?? messages.en
    : messages;
}

async function broadcastSucceeded(
  broadcastMessage: BroadcastMessage,
  status: BroadcastSuccessStatus
) {
  await updateBroadcastMessage(
    broadcastMessage,
    {
      sentAt: now(),
      sendResult: {
        status
      }
    }
  );

  await putMetric("BroadcastMessageSent");
}

async function broadcastFailed(broadcastMessage: BroadcastMessage, error: unknown) {
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

async function createBroadcastMessages(
  request: BroadcastRequest,
  users: User[],
  isTest?: boolean
): Promise<void> {
  const requestUserIds = request.userIds;

  const usersToBroadcast = requestUserIds && !isEmpty(requestUserIds)
    ? users.filter(user => requestUserIds.some(id => id === user.id))
    : users;

  let count = 0;

  for (const user of usersToBroadcast) {
    const language = getUserLanguage(user);

    await storeBroadcastMessage(
      request,
      user,
      text(...getMessages(request.messages, language)),
      isUndefined(isTest) ? request.isTest : isTest
    );

    console.log(`[${++count}/${usersToBroadcast.length}] Created a broadcast message.`);
  }
}

function isMultilingualMessages(messages: BroadcastRequestMessages): messages is MultilingualMessages {
  return "ru" in messages
    && Array.isArray(messages.ru)
    && "en" in messages
    && Array.isArray(messages.en);
}
