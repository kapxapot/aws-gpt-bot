import { now } from "../../src/entities/at";
import { Coupon } from "../../src/entities/coupon";
import { days } from "../../src/entities/term";
import { getCouponSpan } from "../../src/services/couponService";

describe("getCouponSpan", () => {
  test("should return coupon span", () => {
    const coupon: Coupon = {
      id: "",
      code: "invite",
      productCode: "bundle-promo-30-days",
      issuedAt: now(),
      term: days(30)
    };

    const span = getCouponSpan(coupon);

    expect(span.start).toBeDefined();
    expect(span.end).toBeDefined();
  });
});
