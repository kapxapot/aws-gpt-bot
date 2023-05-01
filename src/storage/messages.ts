import { putItem } from "../lib/database";
import { Completion, Message } from "../entities/message";
import { User } from "../entities/user";
import { at } from "../entities/at";
import { Result } from "../lib/error";

const messagesTable = process.env.MESSAGES_TABLE!;

export const storeMessage = async (
  user: User,
  request: string,
  response: Result<Completion>,
  requestedAt: number,
  respondedAt: number
) => await putItem<Message>(
  messagesTable,
  {
    userId: user.id,
    request,
    response,
    requestedAt: at(requestedAt),
    respondedAt: at(respondedAt)
  }
);
