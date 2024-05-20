import { CouponCode } from "../../entities/coupon";
import { issueCoupon } from "../../services/couponService";
import { getUserById } from "../../services/userService";

type CouponPayload = {
  apiKey: string;
  userId: string;
  code: CouponCode;
};

const config = {
  apiKey: process.env.API_KEY
};

export async function couponHandler(payload: CouponPayload) {
  if (!config.apiKey) {
    throw new Error("API key is not configured.");
  }

  const { apiKey, userId, code } = payload;

  if (!apiKey) {
    throw new Error("Empty `apiKey`. A string is expected.");
  }

  if (apiKey !== config.apiKey) {
    throw new Error("Invalid `apiKey`.");
  }

  if (!userId) {
    throw new Error("`userId` is required.");
  }

  const user = await getUserById(userId);

  if (!user) {
    throw new Error(`User ${userId} not found.`);
  }

  if (!code) {
    throw new Error("`code` is required.");
  }

  await issueCoupon(user, code);
}
