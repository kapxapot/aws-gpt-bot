import { putItem, scanItem, updateItem } from "../lib/database";
import { User } from "../entities/user";
import { BroadcastMessage } from "../entities/broadcastMessage";
import { BroadcastRequest } from "../entities/broadcastRequest";

const broadcastMessagesTable = process.env.BROADCAST_MESSAGES_TABLE!;

export const storeBroadcastMessage = async (
  request: BroadcastRequest,
  user: User,
  message: string,
  isTest?: boolean
) => await putItem<BroadcastMessage>(
  broadcastMessagesTable,
  {
    requestId: request.id,
    userId: user.id,
    message,
    isTest
  }
);

export async function updateBroadcastMessage(
  broadcastMessage: BroadcastMessage,
  changes: Partial<BroadcastMessage>
): Promise<BroadcastMessage> {
  return await updateItem<BroadcastMessage>(
    broadcastMessagesTable,
    {
      id: broadcastMessage.id
    },
    changes
  );
}

export async function findBroadcastMessage(request: BroadcastRequest, user: User): Promise<BroadcastMessage | null> {
  return await scanItem<BroadcastMessage>(
    broadcastMessagesTable,
    "requestId = :rid and userId = :uid",
    {
      ":rid": request.id,
      ":uid": user.id
    }
  );
}
