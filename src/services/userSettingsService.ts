import { updatedTimestamps } from "../entities/at";
import { User, UserSettings } from "../entities/user";
import { settings } from "../lib/constants";
import { updateUser } from "../storage/userStorage";

export async function updateUserSettings(user: User, settings: UserSettings): Promise<User> {
  return await updateUser(
    user,
    {
      "settings": settings,
      ...updatedTimestamps()
    }
  );
}

export function getUserHistorySize(user: User): number {
  return user.settings?.historySize ?? settings.historySize.default;
}

export function getUserTemperature(user: User): number {
  return user.settings?.temperature ?? settings.temperature.default;
}
