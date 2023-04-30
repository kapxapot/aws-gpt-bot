import { storeTelegramRequest } from "../storage/telegramRequests";

export async function botHook(requestData: any) {
  await storeTelegramRequest(requestData);
}
