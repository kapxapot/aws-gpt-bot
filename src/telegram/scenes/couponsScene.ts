import { BaseScene } from "telegraf/scenes";
import { BotContext } from "../botContext";
import { scenes, settings, symbols } from "../../lib/constants";
import { addSceneCommandHandlers, backToChatHandler, dunnoHandler, kickHandler } from "../handlers";
import { message } from "telegraf/filters";
import { backToStartAction, cancelAction, cancelButton } from "../../lib/dialog";
import { getUserOrLeave } from "../../services/messageService";
import { getUserActiveCoupons } from "../../services/userService";
import { clearInlineKeyboard, inlineKeyboard, reply, replyWithKeyboard } from "../../lib/telegram";
import { formatWordNumber } from "../../services/grammarService";
import { toCompactText, toText } from "../../lib/common";
import { formatProductName, getProductByCode, getProductPlan } from "../../services/productService";
import { activateCoupon, formatCouponExpiration } from "../../services/couponService";
import { getIdChunk } from "../../lib/uuid";
import { getPlanDescription } from "../../services/planService";
import { bullet } from "../../lib/text";
import { Coupon } from "../../entities/coupon";
import { User } from "../../entities/user";

type CouponData = {
  coupon: Coupon;
  activateCommand: string;
};

type CouponContext = {
  displayCouponData: CouponData[];
  totalCount: number;
  remainingCount: number;
};

const scene = new BaseScene<BotContext>(scenes.coupons);

scene.enter(mainHandler);

addSceneCommandHandlers(scene);

scene.action(cancelAction, backToChatHandler);

scene.action(backToStartAction, async ctx => {
  await clearInlineKeyboard(ctx);
  await mainHandler(ctx);
});

scene.on(message("text"), async ctx => {
  const user = await getUserOrLeave(ctx);

  if (!user) {
    return;
  }

  await clearInlineKeyboard(ctx);

  const { displayCouponData } = buildCouponContext(user);

  for (const couponData of displayCouponData) {
    const { coupon, activateCommand } = couponData;

    if (activateCommand === ctx.message.text) {
      try {
        // activate coupon
        const product = await activateCoupon(user, coupon);

        // купон активирован
        await replyWithKeyboard(
          ctx,
          inlineKeyboard(
            ["Активировать еще один", backToStartAction],
            cancelButton
          ),
          `${symbols.success} Вы успешно активировали купон!`,
          `Вам добавлен ${formatProductName(product)}`
        );

        return;
      } catch (error) {
        await reply(ctx, `${symbols.cross} Ошибка активации купона ${coupon.id}. ${error}`);
      }
    }
  }

  await backToChatHandler(ctx);
});

scene.use(kickHandler);
scene.use(dunnoHandler);

export const couponsScene = scene;

async function mainHandler(ctx: BotContext) {
  const user = await getUserOrLeave(ctx);

  if (!user) {
    return;
  }

  const { displayCouponData, totalCount, remainingCount } = buildCouponContext(user);

  if (!totalCount) {
    await replyWithKeyboard(
      ctx,
      inlineKeyboard(cancelButton),
      "У вас нет купонов. 😯"
    );

    return;
  }

  await replyWithKeyboard(
    ctx,
    inlineKeyboard(cancelButton),
    `У вас ${formatWordNumber("купон", totalCount)} на следующие продукты:`,
    ...displayCouponData
      .map(couponData => {
        const { coupon, activateCommand } = couponData;
        const product = getProductByCode(coupon.productCode);
        const plan = getProductPlan(product);

        return toText(
          toCompactText(
            getPlanDescription(plan, "short"),
            bullet(`Купон действует по ${formatCouponExpiration(coupon)}`)
          ),
          `🚀 Активировать: ${activateCommand}`
        );
      }),
    remainingCount
      ? `И еще ${formatWordNumber("купон", remainingCount)}...`
      : null
  );
}

const activateCommand = (idChunk: string) => `/act${idChunk}`;

function buildCouponContext(user: User): CouponContext {
  const coupons = getUserActiveCoupons(user);
  const totalCount = coupons.length;

  const displayCount = Math.min(settings.couponsToShow, totalCount);
  const usedChunks: string[] = [];

  const displayCouponData: CouponData[] = coupons
      .slice(0, displayCount)
      .map(coupon => {
        const idChunk = getIdChunk(usedChunks, coupon.id);

        usedChunks.push(idChunk);

        return {
          coupon,
          activateCommand: activateCommand(idChunk)
        };
      });

  return {
    displayCouponData,
    totalCount,
    remainingCount: totalCount - displayCount,
  };
}
