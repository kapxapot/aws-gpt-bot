import { User } from "../entities/user";
import { isProd } from "./envService";
import { getUserPlanSettings } from "./planService";
import { isTester } from "./userService";

export const canMakePurchases = (user: User) => isProd() || isTester(user);

/**
 * For now it's simple, but later the quotas will be taken into account too.
 */
export const canRequestImageGeneration = (user: User) => {
  const permissions = getUserPlanPermissions(user);
  return permissions.canRequestImageGeneration;
}

const getUserPlanPermissions = (user: User) => getUserPlanSettings(user).permissions;
