import { CouponCode } from "../../entities/coupon";
import { intervalWords } from "../../entities/interval";
import { toText } from "../../lib/common";
import { commands } from "../../lib/constants";
import { issueCoupon, getCouponTemplateByCode } from "../../services/couponService";
import { getCaseForNumber } from "../../services/grammarService";
import { putMetric } from "../../services/metricService";
import { formatProductName, getProductByCode } from "../../services/productService";
import { getUserById } from "../../services/userService";
import { sendTelegramMessage } from "../../telegram/bot";

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

  const template = getCouponTemplateByCode(code);

  if (!template) {
    throw new Error(`Unknown coupon code: ${code} (template not found).`);
  }

  const coupon = await issueCoupon(user, template);

  await putMetric("CouponIssued");

  const product = getProductByCode(coupon.productCode);
  const { range, unit } = coupon.term;
  const word = intervalWords[unit];

  await sendTelegramMessage(
    user,
    toText(
      `🎉 Вы получили купон на активацию ${formatProductName(product, "Genitive")}.`,
      `Внимание! Срок действия купона ограничен, его нужно активировать в течение <b>${range} ${getCaseForNumber(word, range, "Genitive")}</b>.`,
      `Для активации купона перейдите в раздел /${commands.coupons}`
    )
  );
}
