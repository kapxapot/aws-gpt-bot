import { ButtonLike } from "./telegram";

export const cancelAction = "cancel";
export const cancelButton: ButtonLike = ["Отмена", cancelAction];

export const remindAction = "remindLastMessage";
export const remindButton: ButtonLike = ["На чем мы остановились?", remindAction];

export const gotoPremiumAction = "gotoPremium";
export const gotoPremiumButton: ButtonLike = ["Пакеты услуг", gotoPremiumAction]

export const backToStartAction = "backToStart";
