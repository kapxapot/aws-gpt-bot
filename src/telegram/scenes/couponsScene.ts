import { BaseScene } from "telegraf/scenes";
import { BotContext } from "../botContext";
import { commands, scenes, settings } from "../../lib/constants";
import { addOtherCommandHandlers, backToChatHandler, dunnoHandler, kickHandler } from "../handlers";
import { message } from "telegraf/filters";
import { cancelAction, cancelButton } from "../../lib/dialog";
import { getUserOrLeave } from "../../services/messageService";
import { getUserActiveCoupons } from "../../services/userService";
import { inlineKeyboard, replyWithKeyboard } from "../../lib/telegram";
import { formatWordNumber } from "../../services/grammarService";
import { toCompactText } from "../../lib/common";
import { formatProductName, getProductByCode } from "../../services/productService";
import { formatCouponExpiration } from "../../services/couponService";
import { flattenUuid } from "../../lib/uuid";

const scene = new BaseScene<BotContext>(scenes.coupons);

scene.enter(async ctx => {
  const user = await getUserOrLeave(ctx);

  if (!user) {
    return;
  }

  const coupons = getUserActiveCoupons(user);
  const couponCount = coupons.length;

  if (!couponCount) {
    await replyWithKeyboard(
      ctx,
      inlineKeyboard(cancelButton),
      "У вас нет купонов. 😯"
    );

    return;
  }

  const displayCount = Math.min(settings.couponsToShow, couponCount);

  await replyWithKeyboard(
    ctx,
    inlineKeyboard(cancelButton),
    `У вас ${formatWordNumber("купон", couponCount)} на следующие продукты:`,
    ...coupons
      .slice(0, displayCount)
      .map(coupon => {
        const product = getProductByCode(coupon.productCode);

        return toCompactText(
          formatProductName(product),
          `Действует по ${formatCouponExpiration(coupon)}.`,
          `Активировать: /ac_${flattenUuid(coupon.id)}`
        );
      })
  );
});

addOtherCommandHandlers(scene, commands.coupons);

scene.action(cancelAction, backToChatHandler);

scene.on(message("text"), async ctx => {
  await backToChatHandler(ctx);
});

scene.use(kickHandler);
scene.use(dunnoHandler);

export const couponsScene = scene;
