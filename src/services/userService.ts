import { User as TelegrafUser } from "telegraf/types";
import { User } from "../entities/user";
import { getUserByTelegramId, storeUser } from "../storage/users";

export const getOrAddUser = async (userData: TelegrafUser): Promise<User> => {
  const existingUser = await getUserByTelegramId(userData.id);

  if (existingUser) {
    return existingUser;
  } else {
    console.log("User not found. Telegram id = " + userData.id);
  }

  return await storeUser(userData);
}
