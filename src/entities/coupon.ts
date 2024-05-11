import { Id } from "../lib/types";
import { At } from "./at";
import { ProductCode } from "./product";
import { Term, days30, term } from "./term";

export const couponCodes = [
  "v0.2-poll-reward",
  "invite2024"
] as const;

export type CouponCode = typeof couponCodes[number];

export type CouponTemplate = {
  code: CouponCode;
  productCode: ProductCode;
  term: Term;
};

export type Coupon = CouponTemplate & Id & {
  issuedAt: At;
  activatedAt?: At;
};

export const couponV02PollReward: CouponTemplate = {
  code: "v0.2-poll-reward",
  productCode: "bundle-trial-30-days",
  term: term(3, "month")
};

export const couponInvite2024: CouponTemplate = {
  code: "invite2024",
  productCode: "bundle-invite2024-30-days",
  term: days30
};
