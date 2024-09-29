import { getItem, putItem, scanItems, updateItem } from "../lib/database";
import { User } from "../entities/user";
import { first } from "../lib/common";
import { Unsaved } from "../lib/types";

const usersTable = process.env.USERS_TABLE!;

export async function storeUser(user: Unsaved<User>): Promise<User> {
  return await putItem<User>(usersTable, user);
}

export async function getAllUsers(): Promise<User[]> {
  return await scanItems<User>(usersTable);
}

export async function getUser(id: string): Promise<User | null> {
  return await getItem<User>(usersTable, id);
}

export async function getUserByTelegramId(telegramId: number): Promise<User | null> {
  // for some reason the users can get duplicated
  // that's why we get all users by the telegram id and select the oldest one
  const users = await scanItems<User>(
    usersTable,
    "telegramId = :tid",
    {
      ":tid": telegramId
    }
  );

  const sortedUsers = users.sort((a, b) => a.createdAt - b.createdAt);

  return first(sortedUsers);
}

export async function updateUser(user: User, changes: Partial<User>): Promise<User> {
  return await updateItem<User>(
    usersTable,
    {
      id: user.id
    },
    changes
  );
}

export async function getUsersCount(): Promise<number> {
  // temporary solution, should be like this (but it's bugged):
  // getCount(usersTable) ?? 0;
  const users = await getAllUsers();

  return users.length;
}
