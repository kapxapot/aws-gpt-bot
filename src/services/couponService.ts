import { TimeSpan, now } from "../entities/at";
import { Coupon, CouponCode, CouponTemplate, couponInvite2024, couponV02PollReward } from "../entities/coupon";
import { intervalWords } from "../entities/interval";
import { User } from "../entities/user";
import { toText } from "../lib/common";
import { commands, symbols } from "../lib/constants";
import { uuid } from "../lib/uuid";
import { sendTelegramMessage } from "../telegram/bot";
import { addDays, addTerm, formatDate, isExpired } from "./dateService";
import { formatWordNumber } from "./grammarService";
import { putMetric } from "./metricService";
import { formatProductName, getProductByCode } from "./productService";
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

  // post actions
  await putMetric("CouponIssued");

  const product = getProductByCode(coupon.productCode);
  const word = intervalWords[coupon.term.unit];

  await sendTelegramMessage(
    user,
    toText(
      `🎉 Вы получили купон на активацию ${formatProductName(product, "Genitive")}.`,
      `${symbols.warning} Внимание! Срок действия купона ограничен, его нужно активировать в течение <b>${formatWordNumber(word, coupon.term.range, "Genitive")}</b>.`,
      `Активировать: /${commands.coupons}`
    )
  );

  return coupon;
}

export const isCouponActive = (coupon: Coupon) =>
  !isCouponActivated(coupon) && !isCouponExpired(coupon);

export function getCouponSpan(coupon: Coupon): TimeSpan {
  const start = coupon.issuedAt.timestamp;
  const endOfTerm = addTerm(start, coupon.term);
  const end = addDays(endOfTerm, 1);

  return { start, end };
}

export function formatCouponsString(coupons: Coupon[]): string {
  return `${symbols.coupon} У вас ${formatWordNumber("купон", coupons.length)}: /${commands.coupons}`;
}

export function formatCouponExpiration(coupon: Coupon): string {
  const { end } = getCouponSpan(coupon);
  const expiresAt = new Date(end);

  return formatDate(expiresAt, "dd.MM.yyyy");
}

const isCouponActivated = (coupon: Coupon) => !!coupon.activatedAt;

function isCouponExpired(coupon: Coupon): boolean {
  const span = getCouponSpan(coupon);
  return isExpired(span);
}

const createCoupon = (template: CouponTemplate): Coupon => ({
  ...template,
  id: uuid(),
  issuedAt: now()
});
