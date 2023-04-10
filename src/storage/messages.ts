import { putItem } from "../lib/database";
import { Message } from "../entities/message";
import { User } from "../entities/user";
import { Completion, CompletionError } from "../gpt/chatCompletion";

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
