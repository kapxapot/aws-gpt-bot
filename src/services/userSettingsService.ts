import { User, UserSettings } from "../entities/user";
import { settings } from "../lib/constants";
import { updateUser } from "../storage/userStorage";

export async function updateUserSettings(user: User, changes: Partial<UserSettings>): Promise<User> {
  const settings = {
    ...(user.settings ?? {}),
    ...changes
  };

  return await updateUser(user, { settings });
}

export function getUserHistorySize(user: User): number {
  return user.settings?.historySize ?? settings.historySize.default;
}

export function getUserTemperature(user: User): number {
  return user.settings?.temperature ?? settings.temperature.default;
}
