import { User as TelegrafUser } from "telegraf/types";
import { Message } from "../entities/message";
import { User, UserEvent } from "../entities/user";
import { getUserByTelegramId, storeUser, updateUser } from "../storage/userStorage";
import { Context,  addMessageToHistory, createContext, getCurrentHistory, getCurrentPrompt } from "../entities/context";
import { ModeCode, Prompt, customPromptCode, getPromptByCode, noPromptCode } from "../entities/prompt";
import { updatedTimestamps } from "../entities/at";
import { getUserHistorySize } from "./userSettingsService";

export const getOrAddUser = async (userData: TelegrafUser): Promise<User> => {
  return await getUserByTelegramId(userData.id)
    ?? await storeUser(userData);
}

/**
 * Adds the message to the recent user's messages and sets a prompt if there is none.
 */
export const addMessageToUser = async (user: User, message: Message): Promise<User> => {
  const context = getContext(user);
  addMessageToHistory(context, message, getUserHistorySize(user));

  return await updateContext(user, context);
}

export const newCustomPrompt = async (user: User, customPrompt: string): Promise<User> => {
  const context = getContext(user);

  context.modeCode = "prompt";
  context.promptCode = customPromptCode;
  context.customPrompt = customPrompt;

  return await updateContext(user, context);
}

export const backToCustomPrompt = async (user: User): Promise<User> => {
  const context = getContext(user);

  context.modeCode = "prompt";
  context.promptCode = customPromptCode;

  return await updateContext(user, context);
}

export const setPrompt = async (user: User, prompt: Prompt): Promise<User> => {
  const context = getContext(user);

  context.modeCode = "role";
  context.promptCode = prompt.code;

  return await updateContext(user, context);
}

export const setFreeMode = async (user: User): Promise<User> => {
  const context = getContext(user);

  context.modeCode = "free";
  context.promptCode = noPromptCode;

  return await updateContext(user, context);
}

function getContext(user: User): Context {
  return user.context ?? createContext();
}

async function updateContext(user: User, context: Context): Promise<User> {
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
  const context = user.context;

  if (!context) {
    return { prompt: null, latestMessages: null };
  }

  return {
    prompt: getCurrentPrompt(context),
    latestMessages: getCurrentHistory(context).messages
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
