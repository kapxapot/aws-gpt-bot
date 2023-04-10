import { User } from "telegraf/types";

export function userName(user: User): string {
  return user.first_name ?? user.last_name ?? user.username ?? "аноним";
}
