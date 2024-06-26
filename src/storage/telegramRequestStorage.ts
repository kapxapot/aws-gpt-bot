import { putItem } from "../lib/database";
import { TelegramRequest } from "../entities/telegramRequest";

const telegramRequestsTable = process.env.TELEGRAM_REQUESTS_TABLE!;

export const storeTelegramRequest = async (request: unknown) =>
  await putItem<TelegramRequest>(
    telegramRequestsTable,
    {
      request
    }
  );
