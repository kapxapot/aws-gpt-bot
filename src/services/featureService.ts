import { User } from "../entities/user";
import { isProd } from "./envService";
import { isTester } from "./userService";

export const purchasesEnabled = (user: User) => isProd() || isTester(user);
