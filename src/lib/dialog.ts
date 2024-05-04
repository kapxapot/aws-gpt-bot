import { ButtonLike } from "./telegram";

export const cancelAction = "cancel";
export const cancelButton: ButtonLike = ["Отмена", cancelAction];

export const remindAction = "remindLastMessage";
export const remindButton: ButtonLike = ["На чем мы остановились?", remindAction];

export const anotherImageAction = "anotherImage";
export const anotherImageButton: ButtonLike = ["Создать еще", anotherImageAction];

export const backToStartAction = "backToStart";
export const backToStartButton: ButtonLike = ["Назад", backToStartAction]

export const gotoPremiumAction = "gotoPremium";
export const gotoPremiumButton: ButtonLike = ["Пакеты услуг", gotoPremiumAction]
