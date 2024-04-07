import { v4 as uuid } from "uuid";
import { User as TelegrafUser } from "telegraf/types";
import { Message } from "../entities/message";
import { User, UserEvent } from "../entities/user";
import { getUserByTelegramId, storeUser, updateUser } from "../storage/userStorage";
import { Context } from "../entities/context";
import { Prompt, customPromptCode, noPromptCode } from "../entities/prompt";
import { getUserHistorySize } from "./userSettingsService";
import { addMessageToHistory, createContext, cutoffMessages, getCurrentHistory, getCurrentPrompt } from "./contextService";
import { isSuccess } from "../lib/error";
import { PlanSettings } from "../entities/planSettings";
import { getCurrentSubscription, getSubscriptionPlan } from "./subscriptionService";
import { getPlanSettings, getPlanSettingsImageModel } from "./planSettingsService";
import { Plan } from "../entities/plan";
import { ImageModel } from "../entities/model";
import { PurchasedProduct, isPurchasedProduct } from "../entities/product";
import { isActiveProduct } from "./productService";

type CurrentContext = {
  prompt: string | null;
  latestMessages: Message[] | null;
};

export const getOrAddUser = async (userData: TelegrafUser): Promise<User> => {
  const user = await getUserByTelegramId(userData.id)
    ?? await storeUser(userData);

  return await checkUserIntegrity(user);
}

/**
 * Creates products for events if they are not defined.
 */
async function checkUserIntegrity(user: User): Promise<User> {
  if (!user.events) {
    return user;
  }

  const products = user.events.map(event => userEventToProduct(event));

  return await updateUserProducts(user, products);
}

export async function updateUserProduct(user: User, product: PurchasedProduct): Promise<User> {
  const products = user.products
    ? user.products.map(up => up.id === product.id ? product : up)
    : [product];

  return await updateUserProducts(user, products);
}

export async function updateUserProducts(user: User, products: PurchasedProduct[]): Promise<User> {
  return await updateUser(
    user,
    {
      products
    }
  );
}

/**
 * Adds the message to the recent user's messages and sets a prompt if there is none.
 */
export const addMessageToUser = async (user: User, message: Message): Promise<User> => {
  const context = getUserContext(user);
  const historySize = getUserHistorySize(user);

  addMessageToHistory(context, message, historySize);

  return await updateUserContext(user, context);
}

export const newCustomPrompt = async (user: User, customPrompt: string): Promise<User> => {
  const context = getUserContext(user);

  context.modeCode = "prompt";
  context.promptCode = customPromptCode;
  context.customPrompt = customPrompt;

  return await updateUserContext(user, context);
}

export const backToCustomPrompt = async (user: User): Promise<User> => {
  const context = getUserContext(user);

  context.modeCode = "prompt";
  context.promptCode = customPromptCode;

  return await updateUserContext(user, context);
}

export const setPrompt = async (user: User, prompt: Prompt): Promise<User> => {
  const context = getUserContext(user);

  context.modeCode = "role";
  context.promptCode = prompt.code;

  return await updateUserContext(user, context);
}

export const setFreeMode = async (user: User): Promise<User> => {
  const context = getUserContext(user);

  context.modeCode = "free";
  context.promptCode = noPromptCode;

  return await updateUserContext(user, context);
}

export function getUserContext(user: User): Context {
  if (!user.context) {
    user.context = createContext();
  }

  return user.context;
}

async function updateUserContext(user: User, context: Context): Promise<User> {
  return await updateUser(
    user,
    {
      context
    }
  );
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

export function getLastHistoryMessage(user: User): string | null {
  const { latestMessages } = getCurrentContext(user, 1);

  if (!latestMessages?.length) {
    return null;
  }

  const answer = latestMessages[0].response;

  return isSuccess(answer)
    ? answer.reply
    : null;
}

export async function addUserEvent(user: User, event: UserEvent): Promise<User> {
  const events = user.events ?? [];
  events.push(event);

  const changes: Partial<User> = {
    events
  };

  if (event.type === "purchase") {
    // add product
    changes.products = [
      ...(user.products ?? []),
      userEventToProduct(event)
    ];
  }

  return await updateUser(user, changes);
}

function userEventToProduct(event: UserEvent): PurchasedProduct {
  return {
    ...event.details,
    purchasedAt: event.at,
    id: uuid(),
    usage: {}
  };
}

export async function updateUserEvents(user: User, events: UserEvent[]): Promise<User> {
  return await updateUser(
    user,
    {
      events
    }
  );
}

export async function waitForGptAnswer(user: User): Promise<User> {
  return await updateUser(
    user,
    {
      waitingForGptAnswer: true
    }
  );
}

export async function stopWaitingForGptAnswer(user: User): Promise<User> {
  return await updateUser(
    user,
    {
      waitingForGptAnswer: false
    }
  );
}

export async function waitForGptImageGeneration(user: User): Promise<User> {
  return await updateUser(
    user,
    {
      waitingForGptImageGeneration: true
    }
  );
}

export async function stopWaitingForGptImageGeneration(user: User): Promise<User> {
  return await updateUser(
    user,
    {
      waitingForGptImageGeneration: false
    }
  );
}

export function isTester(user: User) {
  return user.isTester === true;
}

export function getUserPlan(user: User): Plan {
  const subscription = getCurrentSubscription(user);
  return getSubscriptionPlan(subscription);
}

export function getUserPlanSettings(user: User): PlanSettings {
  const plan = getUserPlan(user);
  return getPlanSettings(plan);
}

export function getUserImageModel(user: User): ImageModel {
  const settings = getUserPlanSettings(user);
  return getPlanSettingsImageModel(settings);
}

export function getUserPurchasedProducts(user: User): PurchasedProduct[] {
  return user.products ?? [];
}

export function getUserActiveProduct(user: User): PurchasedProduct | null {
  const subscription = getCurrentSubscription(user);

  return isPurchasedProduct(subscription) && isActiveProduct(subscription)
    ? subscription
    : null;
}
