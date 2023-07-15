import { getCount, getItem, putItem, scanItem, scanItems, updateItem } from "../lib/database";
import { User } from "../entities/user";
import { User as TelegrafUser } from "telegraf/types";

const usersTable = process.env.USERS_TABLE!;

export async function storeUser(tgUser: TelegrafUser): Promise<User> {
  return await putItem<User>(
    usersTable,
    {
      telegramId: tgUser.id,
      firstName: tgUser.first_name,
      lastName: tgUser.last_name,
      username: tgUser.username
    }
  );
}

export async function getAllUsers(): Promise<User[]> {
  return await scanItems<User>(usersTable);
}

export async function getUser(id: string): Promise<User | null> {
  return await getItem<User>(usersTable, id);
}

export async function getUserByTelegramId(telegramId: number): Promise<User | null> {
  return await scanItem<User>(
    usersTable,
    "telegramId = :tid",
    {
      ":tid": telegramId
    }
  );
}

export async function updateUser(user: User, changes: Record<string, any>): Promise<User> {
  return await updateItem<User>(
    usersTable,
    {
      id: user.id
    },
    changes
  );
}

export async function getUsersCount(): Promise<number> {
  return await getCount(usersTable) ?? 0;
}
