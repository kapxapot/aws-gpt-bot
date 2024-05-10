import { now } from "../entities/at";
import { Coupon, CouponCode, CouponTemplate, couponInvite2024, couponV02PollReward } from "../entities/coupon";
import { User } from "../entities/user";
import { uuid } from "../lib/uuid";
import { addUserCoupon } from "./userService";

export function getCouponTemplateByCode(code: CouponCode): CouponTemplate {
  switch (code) {
    case "v0.2-poll-reward":
      return couponV02PollReward;

    case "invite2024":
      return couponInvite2024;
  }
}

export async function addCoupon(user: User, template: CouponTemplate): Promise<User> {
  const coupon = createCoupon(template);
  return await addUserCoupon(user, coupon);
}

const createCoupon = (template: CouponTemplate): Coupon => ({
  ...template,
  id: uuid(),
  createdAt: now()
});
