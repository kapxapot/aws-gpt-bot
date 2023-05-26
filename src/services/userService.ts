import { User as TelegrafUser } from "telegraf/types";
import { Message } from "../entities/message";
import { UsageStats, User, UserEvent } from "../entities/user";
import { getUserByTelegramId, storeUser, updateUser } from "../storage/userStorage";
import { Context } from "../entities/context";
import { Prompt, customPromptCode, noPromptCode } from "../entities/prompt";
import { getUserHistorySize } from "./userSettingsService";
import { addMessageToHistory, createContext, cutoffMessages, getCurrentHistory, getCurrentPrompt } from "./contextService";

export const getOrAddUser = async (userData: TelegrafUser): Promise<User> => {
  return await getUserByTelegramId(userData.id)
    ?? await storeUser(userData);
}

/**
 * Adds the message to the recent user's messages and sets a prompt if there is none.
 */
export const addMessageToUser = async (user: User, message: Message): Promise<User> => {
  const context = getContext(user);
  const historySize = getUserHistorySize(user);

  addMessageToHistory(context, message, historySize);

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

export function getContext(user: User): Context {
  if (!user.context) {
    user.context = createContext();
  }

  return user.context;
}

async function updateContext(user: User, context: Context): Promise<User> {
  return await updateUser(user, { context });
}

interface CurrentContext {
  prompt: string | null;
  latestMessages: Message[] | null;
}

/**
 * Refactor this.
 */
export function getCurrentContext(user: User, historySize: number): CurrentContext {
  const context = user.context;

  if (!context) {
    return { prompt: null, latestMessages: null };
  }

  const history = getCurrentHistory(context);
  const latestMessages = cutoffMessages(history, historySize);

  return {
    prompt: getCurrentPrompt(context),
    latestMessages
  };
}

export async function addUserEvent(user: User, event: UserEvent): Promise<User> {
  const events = user.events ?? [];

  events.push(event);

  return await updateUser(user, { events });
}

export async function waitForGptAnswer(user: User): Promise<User> {
  return await updateUser(
    user,
    {
      waitingForGptAnswer: true
    }
  );
}

export async function gotGptAnswer(user: User): Promise<User> {
  return await updateUser(
    user,
    {
      waitingForGptAnswer: false
    }
  );
}

export async function updateUsageStats(user: User, usageStats: UsageStats): Promise<User> {
  return await updateUser(user, { usageStats });
}
