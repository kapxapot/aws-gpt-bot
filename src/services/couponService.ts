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

export async function issueCoupon(user: User, template: CouponTemplate): Promise<Coupon> {
  const coupon = createCoupon(template);
  await addUserCoupon(user, coupon);

  return coupon;
}

const createCoupon = (template: CouponTemplate): Coupon => ({
  ...template,
  id: uuid(),
  createdAt: now()
});
