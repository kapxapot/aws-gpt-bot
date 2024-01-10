import { now } from "../entities/at";
import { BroadcastMessage } from "../entities/broadcastMessage";
import { storeBroadcastMessage, updateBroadcastMessage } from "../storage/broadcastMessageStorage";
import { getAllUsers, getUser } from "../storage/userStorage";
import { sendTelegramMessage } from "../telegram/bot";

/**
 * Adds broadcast messages for all users.
 */
export async function addBroadcast(message: string) {
  const users = await getAllUsers();

  for (const user of users) {
    await storeBroadcastMessage(user, message);
  };
}

export async function sendBroadcastMessage(broadcastMessage: BroadcastMessage) {
  const user = await getUser(broadcastMessage.userId);

  if (user) {
    await sendTelegramMessage(user, broadcastMessage.message);

    await updateBroadcastMessage(
      broadcastMessage,
      {
        sentAt: now()
      }
    );
  }
}
