import { User as TelegrafUser } from "telegraf/types";
import { Message } from "../entities/message";
import { InactivityRecord, User } from "../entities/user";
import { getUser, getUserByTelegramId, storeUser, updateUser } from "../storage/userStorage";
import { Context } from "../entities/context";
import { Prompt } from "../entities/prompt";
import { getUserHistorySize } from "./userSettingsService";
import { addMessageToHistory, createContext, cutoffMessages, getCurrentHistory, getCurrentPrompt } from "./contextService";
import { isSuccess } from "../lib/error";
import { getCurrentSubscription, getSubscriptionPlan } from "./subscriptionService";
import { Plan } from "../entities/plan";
import { PurchasedProduct } from "../entities/product";
import { isProductActive } from "./productService";
import { Coupon } from "../entities/coupon";
import { isCouponActive } from "./couponService";
import { atSort, now } from "../entities/at";
import { cipherNumber } from "./cipherService";
import { Language, Unsaved } from "../lib/types";
import { dataEquals } from "../lib/common";
import { settings } from "../lib/constants";
import { t } from "../lib/translate";

type CurrentContext = {
  prompt: string | null;
  latestMessages: Message[] | null;
};

export type UserResult = {
  user: User;
  isNew: boolean;
};

const config = {
  botUrl: process.env.BOT_URL!
};

export async function getUserById(id: string): Promise<User | null> {
  return await getUser(id);
}

export async function getOrAddUser(tgUser: TelegrafUser): Promise<UserResult> {
  const userData = telegrafUserToUser(tgUser);
  let user = await getUserByTelegramId(tgUser.id);

  if (user) {
    if (!dataEquals(user, userData)) {
      user = await updateUser(user, userData);
    }

    return { user, isNew: false };
  }

  user = await storeUser(userData);

  return { user, isNew: true };
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

export async function updateUserCoupon(user: User, coupon: Coupon): Promise<User> {
  const coupons = user.coupons ?? [];

  return await updateUserCoupons(
    user,
    coupons.map(uc => uc.id === coupon.id ? coupon : uc)
  );
}

export async function addUserCoupon(user: User, coupon: Coupon): Promise<User> {
  const coupons = user.coupons ?? [];

  return await updateUserCoupons(
    user,
    [ ...coupons, coupon ]
  );
}

export async function updateUserCoupons(user: User, coupons: Coupon[]): Promise<User> {
  return await updateUser(
    user,
    {
      coupons
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
  context.promptCode = "_custom";
  context.customPrompt = customPrompt;

  return await updateUserContext(user, context);
}

export const backToCustomPrompt = async (user: User): Promise<User> => {
  const context = getUserContext(user);

  context.modeCode = "prompt";
  context.promptCode = "_custom";

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
  context.promptCode = "_none";

  return await updateUserContext(user, context);
}

export function getUserContext(user: User): Context {
  if (!user.context) {
    user.context = createContext();
  }

  return user.context;
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
    prompt: getCurrentPrompt(user, context),
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

export function getUserProducts(user: User): PurchasedProduct[] {
  return user.products ?? [];
}

/**
 * Returns user's active products sorted by their purchase date descending.
 */
export const getUserActiveProducts = (user: User): PurchasedProduct[] =>
  getUserProducts(user)
    .filter(product => isProductActive(product))
    .sort(atSort(product => product.purchasedAt));

export function getUserCoupons(user: User): Coupon[] {
  return user.coupons ?? [];
}

/**
 * Returns user's active coupons sorted by their issue date descending.
 */
export function getUserActiveCoupons(user: User): Coupon[] {
  return getUserCoupons(user)
    .filter(coupon => isCouponActive(coupon))
    .sort(atSort(coupon => coupon.issuedAt));
}

export function getUserInviteLink(user: User): string {
  const cipheredUserId = cipherNumber(user.telegramId);
  return `${config.botUrl}?start=${cipheredUserId}`;
}

export async function deactivateUser(
  user: User,
  inactivityRecord: InactivityRecord
): Promise<User> {
  return await updateUser(
    user,
    {
      status: {
        isActive: false,
        updatedAt: now(),
        inactivityRecord
      }
    }
  );
}

export async function activateUser(user: User): Promise<User> {
  return await updateUser(
    user,
    {
      status: {
        isActive: true,
        updatedAt: now()
      }
    }
  );
}

export function getUserLanguage(user: User): Language {
  return user.languageCode ?? settings.defaultLanguage;
}

export function getUserName(user: User) {
  return user.firstName ?? user.lastName ?? user.username ?? t(user, "anonymous");
}

function telegrafUserToUser(tgUser: TelegrafUser): Unsaved<User> {
  return {
    telegramId: tgUser.id,
    languageCode: tgUser.language_code,
    firstName: tgUser.first_name,
    lastName: tgUser.last_name,
    username: tgUser.username
  };
}

async function updateUserContext(user: User, context: Context): Promise<User> {
  return await updateUser(
    user,
    {
      context
    }
  );
}
