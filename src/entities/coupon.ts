import { Id } from "../lib/types";
import { At } from "./at";
import { ProductCode } from "./product";
import { Term, days, months } from "./term";

export const couponCodes = [
  "poll-reward",
  "invite",
  "welcome",
  "fanclub-promo"
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

export const couponPollReward: CouponTemplate = {
  code: "poll-reward",
  productCode: "bundle-trial-30-days",
  term: months(3)
};

export const couponInvite: CouponTemplate = {
  code: "invite",
  productCode: "bundle-promo-30-days",
  term: days(30)
};

export const couponWelcome: CouponTemplate = {
  code: "welcome",
  productCode: "bundle-trial-30-days",
  term: months(3)
};

export const couponFanclubPromo: CouponTemplate = {
  code: "welcome",
  productCode: "bundle-promo-30-days",
  term: days(30)
};
