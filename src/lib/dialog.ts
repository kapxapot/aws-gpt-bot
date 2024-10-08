import { User } from "../entities/user";
import { ButtonLike } from "./telegram";
import { t } from "./translate";

export const cancelAction = "cancel";

export const getCancelButton = (user: User): ButtonLike => ({
  label: t(user, "Cancel"),
  action: cancelAction,
  fullWidth: true
});

export const remindAction = "remindLastMessage";

export const getRemindButton = (user: User): ButtonLike => ({
  label: t(user, "whereWereWe"),
  action: remindAction
});

export const gotoPremiumAction = "gotoPremium";

export const getGotoPremiumButton = (user: User): ButtonLike => ({
  label: t(user, "gotoPremium"),
  action: gotoPremiumAction
});

export const backToStartAction = "backToStart";
