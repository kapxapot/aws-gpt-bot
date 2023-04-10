import { putItem } from "../lib/database";
import { Message } from "../entities/message";
import { User } from "../entities/user";

const messagesTable = process.env.MESSAGES_TABLE!;

export const storeMessage = async (user: User, request: string, response: string | null) =>
  await putItem<Message>(
    messagesTable,
    {
      userId: user.id,
      request,
      response
    }
  );
