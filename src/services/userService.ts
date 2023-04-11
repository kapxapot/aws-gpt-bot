import { User as TelegrafUser } from "telegraf/types";
import { Message } from "../entities/message";
import { User } from "../entities/user";
import { getUserByTelegramId, storeUser, updateUser } from "../storage/users";

const userMessageCacheSize = 3;

export const getOrAddUser = async (userData: TelegrafUser): Promise<User> => {
  const existingUser = await getUserByTelegramId(userData.id);

  if (existingUser) {
    return existingUser;
  } else {
    console.log("User not found. Telegram id = " + userData.id);
  }

  return await storeUser(userData);
}

/**
 * Adds the message to the recent user's messages and sets a prompt if there is none.
 */
export const addMessageToUser = async (user: User, message: Message): Promise<User> => {
  const latestMessages = user.latestMessages ?? [];

  latestMessages.push(message);

  let changes: Record<string, any> = {
    "latestMessages": latestMessages.slice(userMessageCacheSize * -1)
  };

  if (!user.prompt) {
    changes["prompt"] = message;
  }

  console.log("changes", changes);

  return await updateUser(user, changes);
}
