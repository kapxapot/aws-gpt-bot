import { TimeSpan, now } from "../entities/at";
import { Coupon, CouponCode, CouponTemplate, couponTemplates } from "../entities/coupon";
import { PurchasedProduct } from "../entities/product";
import { User } from "../entities/user";
import { formatCommand } from "../lib/commands";
import { isEmpty } from "../lib/common";
import { commands } from "../lib/constants";
import { text } from "../lib/text";
import { t, tWordNumber } from "../lib/translate";
import { uuid } from "../lib/uuid";
import { sendTelegramMessage } from "../telegram/bot";
import { addDays, addTerm, formatDate, isExpired } from "./dateService";
import { putMetric } from "./metricService";
import { formatProductName, getProductByCode, productToPurchasedProduct } from "./productService";
import { addUserCoupon, addUserProduct, updateUserCoupon } from "./userService";

export function getCouponTemplateByCode(user: User, code: CouponCode): CouponTemplate {
  const template = couponTemplates.find(ct => ct.code === code);

  if (!template) {
    throw new Error(
      t(user, "couponTemplateNotFound", {
        couponCode: code
      })
    );
  }

  return template;
}

export async function issueCoupon(user: User, code: CouponCode): Promise<Coupon> {
  const template = getCouponTemplateByCode(user, code);
  const coupon = createCoupon(template);
  await addUserCoupon(user, coupon);

  // post actions
  await putMetric("CouponIssued");

  const product = getProductByCode(user, coupon.productCode);
  const term = coupon.term;

  await sendTelegramMessage(
    user,
    text(
      t(user, "gotCoupon", {
        productName: formatProductName(user, product, "Genitive")
      }),
      t(user, "activateCouponInTerm", {
        couponTerm: tWordNumber(user, term.unit, term.range, "Genitive")
      }),
      t(user, "activateCoupon", {
        activateCommand: formatCommand(commands.coupons)
      })
    )
  );

  return coupon;
}

export async function activateCoupon(user: User, coupon: Coupon): Promise<PurchasedProduct> {
  const product = getProductByCode(user, coupon.productCode);

  if (!product) {
    throw new Error(
      t(user, "errors.productNotFound", {
        productCode: coupon.productCode
      })
    );
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

export function formatCouponsString(user: User, coupons: Coupon[]): string | null {
  if (isEmpty(coupons)) {
    return null;
  }

  return t(user, "userCoupons", {
    coupons: tWordNumber(user, "coupon", coupons.length),
    couponsCommand: formatCommand(commands.coupons)
  });
}

export function formatCouponExpiration(user: User, coupon: Coupon): string {
  const { end } = getCouponSpan(coupon);
  const expiresAt = new Date(end);

  return formatDate(expiresAt, t(user, "dateFormat"));
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
