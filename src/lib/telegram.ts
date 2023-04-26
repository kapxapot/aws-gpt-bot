import { User } from "telegraf/types";

export function userName(user: User): string {
  return user.first_name ?? user.last_name ?? user.username ?? "anonymous";
}

export function clearInlineKeyboard(ctx: any) {
  try {
    ctx.editMessageReplyMarkup({ inline_keyboard: [] });
  }
  catch {
  }
}

export function dunno(ctx: any) {
  ctx.reply("Я не понял ваш запрос. Используйте меню диалога. 👆");
}

export function sliceButtons<T>(buttons: T[], limit: number = 2): T[][] {
  const result = [];

  for (let i = 0; i < buttons.length; i += limit) {
    result.push(
      buttons.slice(i, i + limit)
    );
  }

  return result;
}
