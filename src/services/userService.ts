import { User as TelegrafUser } from "telegraf/types";
import { Message } from "../entities/message";
import { User } from "../entities/user";
import { timestamp } from "../lib/common";
import { getUserByTelegramId, storeUser, updateUser } from "../storage/users";
import { Context, IContext } from "../entities/context";
import { History } from "../entities/history";

export const getOrAddUser = async (userData: TelegrafUser): Promise<User> => {
  const existingUser = await getUserByTelegramId(userData.id);

  if (existingUser) {
    return existingUser;
  } else {
    console.log(`User not found. Telegram id = ${userData.id}`);
  }

  return await storeUser(userData);
}

/**
 * Adds the message to the recent user's messages and sets a prompt if there is none.
 */
export const addMessageToUser = async (user: User, message: Message): Promise<User> => {
  const context = user.context
    ? Context.fromInterface(user.context)
    : new Context(message.request);

  context.addMessage(message);

  return await updateContext(user, context);
}

async function updateContext(user: User, context: IContext): Promise<User> {
  return await updateUser(
    user,
    {
      "context": context,
      "updatedAt": timestamp(),
    }
  );
}

export interface CurrentContext {
  prompt: string | null;
  latestMessages: Message[] | null;
}

export function getCurrentContext(user: User): CurrentContext {
  if (!user.context) {
    return { prompt: null, latestMessages: null };
  }

  const context = Context.fromInterface(user.context);

  return {
    prompt: context.customPrompt,
    latestMessages: context.getCurrentHistory().messages
  };
}
