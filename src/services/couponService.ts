import { TimeSpan, now } from "../entities/at";
import { Coupon, CouponCode, CouponTemplate, couponTemplates } from "../entities/coupon";
import { intervalWords } from "../entities/interval";
import { PurchasedProduct } from "../entities/product";
import { User } from "../entities/user";
import { formatCommand } from "../lib/commands";
import { isEmpty } from "../lib/common";
import { commands, symbols } from "../lib/constants";
import { text } from "../lib/text";
import { uuid } from "../lib/uuid";
import { sendTelegramMessage } from "../telegram/bot";
import { addDays, addTerm, formatDate, isExpired } from "./dateService";
import { formatWordNumber } from "./grammarService";
import { putMetric } from "./metricService";
import { formatProductName, getProductByCode, productToPurchasedProduct } from "./productService";
import { addUserCoupon, addUserProduct, updateUserCoupon } from "./userService";

export function getCouponTemplateByCode(code: CouponCode): CouponTemplate {
  const template = couponTemplates.find(ct => ct.code === code);

  if (!template) {
    throw new Error(`Coupon template not found. Unknown coupon code: ${code}.`)
  }

  return template;
}

export async function issueCoupon(user: User, code: CouponCode): Promise<Coupon> {
  const template = getCouponTemplateByCode(code);
  const coupon = createCoupon(template);
  await addUserCoupon(user, coupon);

  // post actions
  await putMetric("CouponIssued");

  const product = getProductByCode(coupon.productCode);
  const word = intervalWords[coupon.term.unit];

  await sendTelegramMessage(
    user,
    text(
      `🎉 Вы получили купон на активацию ${formatProductName(product, "Genitive")}.`,
      `${symbols.warning} Внимание! Срок действия купона ограничен, его нужно активировать в течение <b>${formatWordNumber(word, coupon.term.range, "Genitive")}</b>.`,
      `🚀 Активировать: ${formatCommand(commands.coupons)}`
    )
  );

  return coupon;
}

export async function activateCoupon(user: User, coupon: Coupon): Promise<PurchasedProduct> {
  const product = getProductByCode(coupon.productCode);

  if (!product) {
    throw new Error(`Продукт ${coupon.productCode} не найден.`)
  }

  const then = now();
  coupon.activatedAt = then;
  await updateUserCoupon(user, coupon);

  await putMetric("CouponActivated");

  const purchasedProduct = productToPurchasedProduct(product, then)
  await addUserProduct(user, purchasedProduct);

  return purchasedProduct;
}

export const isCouponActive = (coupon: Coupon) =>
  !isCouponActivated(coupon) && !isCouponExpired(coupon);

export function getCouponSpan(coupon: Coupon): TimeSpan {
  const start = coupon.issuedAt.timestamp;
  const endOfTerm = addTerm(start, coupon.term);
  const end = addDays(endOfTerm, 1);

  return { start, end };
}

export function formatCouponsString(coupons: Coupon[]): string | null {
  if (isEmpty(coupons)) {
    return null;
  }

  return `${symbols.coupon} У вас ${formatWordNumber("купон", coupons.length)}: ${formatCommand(commands.coupons)}`;
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
