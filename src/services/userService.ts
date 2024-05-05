import { User as TelegrafUser } from "telegraf/types";
import { Message } from "../entities/message";
import { User } from "../entities/user";
import { getUser, getUserByTelegramId, storeUser, updateUser } from "../storage/userStorage";
import { Context } from "../entities/context";
import { Prompt, customPromptCode, noPromptCode } from "../entities/prompt";
import { getUserHistorySize } from "./userSettingsService";
import { addMessageToHistory, createContext, cutoffMessages, getCurrentHistory, getCurrentPrompt } from "./contextService";
import { isSuccess } from "../lib/error";
import { getCurrentSubscription, getSubscriptionPlan } from "./subscriptionService";
import { Plan } from "../entities/plan";
import { PurchasedProduct, isPurchasedProduct } from "../entities/product";
import { isActiveProduct, productToPurchasedProduct } from "./productService";

type CurrentContext = {
  prompt: string | null;
  latestMessages: Message[] | null;
};

export async function getUserById(id: string): Promise<User | null> {
  const user = await getUser(id);

  return user
    ? await checkUserIntegrity(user)
    : null;
}

export async function getOrAddUser(tgUser: TelegrafUser): Promise<User> {
  const user = await getUserByTelegramId(tgUser.id)
    ?? await storeUser(tgUser);

  return await checkUserIntegrity(user);
}

export async function addUserProduct(user: User, product: PurchasedProduct): Promise<User> {
  const products = user.products ?? [];

  return await updateUserProducts(
    user,
    [ ...products, product ]
  );
}

export async function updateUserProduct(user: User, product: PurchasedProduct): Promise<User> {
  const products = user.products ?? [];

  return await updateUserProducts(
    user,
    products.map(up => up.id === product.id ? product : up)
  );
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

export function userHasHistoryMessage(user: User): boolean {
  const message = getLastHistoryMessage(user);
  return !!message;
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

export function getUserPurchasedProducts(user: User): PurchasedProduct[] {
  return user.products ?? [];
}

export function getUserActiveProduct(user: User): PurchasedProduct | null {
  const subscription = getCurrentSubscription(user);

  return isPurchasedProduct(subscription) && isActiveProduct(subscription)
    ? subscription
    : null;
}

/**
 * Creates products for events if they are not defined.
 */
async function checkUserIntegrity(user: User): Promise<User> {
  if (user.products || !user.events) {
    return user;
  }

  const products: PurchasedProduct[] = [];
  
  for (const event of user.events) {
    if (event.type === "purchase") {
      const product = productToPurchasedProduct(event.details, event.at);
      products.push(product);
    }
  }

  return await updateUserProducts(user, products);
}
