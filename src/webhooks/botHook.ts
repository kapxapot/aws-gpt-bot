import { storeTelegramRequest } from "../storage/telegramRequestStorage";

export async function botHook(requestData: unknown) {
  await storeTelegramRequest(requestData);
}
