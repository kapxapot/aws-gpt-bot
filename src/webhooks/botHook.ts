import { storeTelegramRequest } from "../storage/telegramRequestStorage";

export async function botHook(requestData: any) {
  await storeTelegramRequest(requestData);
}
