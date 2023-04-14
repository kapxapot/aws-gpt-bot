import { attributesToRemoveExpression, getItem, putItem, recordToAttributes, recordToSetExpression, scanItem, updateItem } from "../lib/database";
import { User } from "../entities/user";
import { User as TelegrafUser } from "telegraf/types";

const usersTable = process.env.USERS_TABLE!;

export const storeUser = async (tgUser: TelegrafUser): Promise<User> =>
  await putItem<User>(
    usersTable,
    {
      telegramId: tgUser.id,
      firstName: tgUser.first_name,
      lastName: tgUser.last_name,
      username: tgUser.username
    }
  );

export const getUser = async (id: string): Promise<User | null> =>
  await getItem<User>(usersTable, id);

export const getUserByTelegramId = async (telegramId: number): Promise<User | null> =>
  await scanItem<User>(
    usersTable,
    "telegramId = :tid",
    {
      ":tid": telegramId
    }
  );

export const updateUser = async (user: User, changes: Record<string, any>): Promise<User> =>
  await updateItem<User>(
    usersTable,
    {
      id: user.id
    },
    recordToSetExpression(changes),
    recordToAttributes(changes)
  );

export const removeFromUser = async (user: User, attributes: string[]): Promise<User> =>
  await updateItem<User>(
    usersTable,
    {
      id: user.id
    },
    attributesToRemoveExpression(attributes)
  );
