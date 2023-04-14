import { putItem } from "../lib/database";
import { Completion, CompletionError, Message } from "../entities/message";
import { User } from "../entities/user";

const messagesTable = process.env.MESSAGES_TABLE!;

export const storeMessage = async (
  user: User,
  request: string,
  response: Completion | CompletionError,
  requestedAt: number,
  respondedAt: number
) => await putItem<Message>(
  messagesTable,
  {
    userId: user.id,
    request,
    response,
    requestedAt,
    respondedAt
  }
);
