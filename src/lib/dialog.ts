import { User } from "../entities/user";
import { ButtonLike } from "./telegram";
import { t } from "./translate";

export const cancelAction = "cancel";

export const getCancelButton = (user: User): ButtonLike =>
  [t(user, "Cancel"), cancelAction];

export const remindAction = "remindLastMessage";

export const getRemindButton = (user: User): ButtonLike =>
  [t(user, "whereWereWe"), remindAction];

export const gotoPremiumAction = "gotoPremium";

export const getGotoPremiumButton = (user: User): ButtonLike =>
  [t(user, "gotoPremium"), gotoPremiumAction];

export const backToStartAction = "backToStart";
