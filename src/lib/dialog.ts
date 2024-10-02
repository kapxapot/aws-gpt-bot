import { User } from "../entities/user";
import { ButtonLike } from "./telegram";
import { t } from "./translate";

export const cancelAction = "cancel";

export const getCancelButton = (user: User): ButtonLike =>
  [t(user, "Cancel"), cancelAction];

export const remindAction = "remindLastMessage";
export const remindButton: ButtonLike = ["На чем мы остановились?", remindAction];

export const gotoPremiumAction = "gotoPremium";
export const gotoPremiumButton: ButtonLike = ["Пакеты услуг", gotoPremiumAction]

export const backToStartAction = "backToStart";
