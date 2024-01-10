import { putItem, updateItem } from "../lib/database";
import { User } from "../entities/user";
import { BroadcastMessage } from "../entities/broadcastMessage";

const messagesTable = process.env.BROADCAST_MESSAGES_TABLE!;

export const storeBroadcastMessage = async (
  user: User,
  message: string
) => await putItem<BroadcastMessage>(
  messagesTable,
  {
    userId: user.id,
    message
  }
);

export async function updateBroadcastMessage(
  broadcastMessage: BroadcastMessage,
  changes: Record<string, any>
): Promise<BroadcastMessage> {
  return await updateItem<BroadcastMessage>(
    messagesTable,
    {
      id: broadcastMessage.id
    },
    changes
  );
}
