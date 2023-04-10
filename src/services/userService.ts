import { User as TelegrafUser } from "telegraf/types";
import { User } from "../entities/user";
import { getUserByTelegramId, storeUser } from "../storage/users";

export const getOrAddUser = async (userData: TelegrafUser): Promise<User> =>
  await getUserByTelegramId(userData.id) ?? await storeUser(userData);
