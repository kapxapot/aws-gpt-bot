import { User as TelegrafUser } from "telegraf/types";
import { Message } from "../entities/message";
import { User, UserEvent } from "../entities/user";
import { getUserByTelegramId, storeUser, updateUser } from "../storage/userStorage";
import { Context, IContext } from "../entities/context";
import { Prompt, customPromptCode, getPromptByCode } from "../entities/prompt";
import { updatedTimestamps } from "../entities/at";

export const getOrAddUser = async (userData: TelegrafUser): Promise<User> => {
  return await getUserByTelegramId(userData.id)
    ?? await storeUser(userData);
}

/**
 * Adds the message to the recent user's messages and sets a prompt if there is none.
 */
export const addMessageToUser = async (user: User, message: Message): Promise<User> => {
  const context = getContext(user);
  context.addMessage(message);

  return await updateContext(user, context);
}

export const newCustomPrompt = async (user: User, customPrompt: string): Promise<User> => {
  const context = getContext(user);

  context.customPrompt = customPrompt;
  context.promptCode = customPromptCode;

  return await updateContext(user, context);
}

export const backToCustomPrompt = async (user: User): Promise<User> => {
  const context = getContext(user);
  context.promptCode = customPromptCode;

  return await updateContext(user, context);
}

export const setPrompt = async (user: User, prompt: Prompt): Promise<User> => {
  const context = getContext(user);

  context.promptCode = prompt.code;

  return await updateContext(user, context);
}

function getContext(user: User): Context {
  return user.context
    ? Context.fromInterface(user.context)
    : new Context();
}

async function updateContext(user: User, context: IContext): Promise<User> {
  return await updateUser(
    user,
    {
      "context": context,
      ...updatedTimestamps()
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

  const prompt = (context.promptCode === customPromptCode)
    ? context.customPrompt
    : getPromptByCode(context.promptCode)?.content ?? null;

  return {
    prompt,
    latestMessages: context.getCurrentHistory().messages
  };
}

export async function addUserEvent(user: User, event: UserEvent): Promise<User> {
  const events = user.events ?? [];

  events.push(event);

  return await updateUser(
    user,
    {
      events
    }
  );
}
