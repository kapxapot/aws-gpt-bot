import { now } from "../entities/at";
import { Coupon, CouponCode, CouponTemplate, couponInvite2024, couponV02PollReward } from "../entities/coupon";
import { intervalWords } from "../entities/interval";
import { User } from "../entities/user";
import { toText } from "../lib/common";
import { commands } from "../lib/constants";
import { uuid } from "../lib/uuid";
import { sendTelegramMessage } from "../telegram/bot";
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
  const { range, unit } = coupon.term;
  const word = intervalWords[unit];

  await sendTelegramMessage(
    user,
    toText(
      `🎉 Вы получили купон на активацию ${formatProductName(product, "Genitive")}.`,
      `Внимание! Срок действия купона ограничен, его нужно активировать в течение <b>${formatWordNumber(word, range, "Genitive")}</b>.`,
      `Для активации купона перейдите в раздел /${commands.coupons}`
    )
  );

  return coupon;
}

const createCoupon = (template: CouponTemplate): Coupon => ({
  ...template,
  id: uuid(),
  createdAt: now()
});
