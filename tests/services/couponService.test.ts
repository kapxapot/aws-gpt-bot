import { now } from "../../src/entities/at";
import { Coupon } from "../../src/entities/coupon";
import { days30 } from "../../src/entities/term";
import { getCouponSpan } from "../../src/services/couponService";

describe("getCouponSpan", () => {
  test("should return coupon span", () => {
    const coupon: Coupon = {
      id: "",
      code: "invite2024",
      productCode: "bundle-invite2024-30-days",
      issuedAt: now(),
      term: days30
    };

    const span = getCouponSpan(coupon);

    expect(span.start).toBeDefined();
    expect(span.end).toBeDefined();
  });
});
