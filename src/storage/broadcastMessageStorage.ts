import { putItem, updateItem } from "../lib/database";
import { User } from "../entities/user";
import { BroadcastMessage } from "../entities/broadcastMessage";

const broadcastMessagesTable = process.env.BROADCAST_MESSAGES_TABLE!;

export const storeBroadcastMessage = async (
  user: User,
  message: string
) => await putItem<BroadcastMessage>(
  broadcastMessagesTable,
  {
    userId: user.id,
    message
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
