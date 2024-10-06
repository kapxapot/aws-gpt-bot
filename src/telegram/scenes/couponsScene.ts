import { BaseScene } from "telegraf/scenes";
import { BotContext } from "../botContext";
import { scenes, settings } from "../../lib/constants";
import { addSceneCommandHandlers, backToChatHandler, dunnoHandler, kickHandler } from "../handlers";
import { message } from "telegraf/filters";
import { backToStartAction, cancelAction, getCancelButton } from "../../lib/dialog";
import { withUser } from "../../services/messageService";
import { getUserActiveCoupons } from "../../services/userService";
import { clearInlineKeyboard, inlineKeyboard, reply, replyWithKeyboard } from "../../lib/telegram";
import { formatProductDescription, formatProductName, getProductByCode } from "../../services/productService";
import { activateCoupon, formatCouponExpiration } from "../../services/couponService";
import { getIdChunk } from "../../lib/uuid";
import { bullet, compactText, sentence, text } from "../../lib/text";
import { Coupon } from "../../entities/coupon";
import { User } from "../../entities/user";
import { t, tWordNumber } from "../../lib/translate";

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
  await withUser(
    ctx,
    async user => await textHandler(ctx, user, ctx.message.text)
  );
});

async function textHandler(ctx: BotContext, user: User, text: string) {
  await clearInlineKeyboard(ctx);

  const { displayCouponData } = buildCouponContext(user);

  for (const couponData of displayCouponData) {
    const { coupon, activateCommand } = couponData;

    if (activateCommand === text) {
      try {
        await activateUserCoupon(ctx, user, coupon);
        return;
      } catch (error) {
        await reply(
          ctx,
          sentence(
            t(user, "errors.couponActivationError", {
              couponId: coupon.id
            }),
            String(error)
          )
        );
      }
    }
  }

  await backToChatHandler(ctx);
}

async function activateUserCoupon(ctx: BotContext, user: User, coupon: Coupon) {
  const product = await activateCoupon(user, coupon);

  await replyWithKeyboard(
    ctx,
    inlineKeyboard(
      [
        t(user, "activateOneMoreMasculine"),
        backToStartAction
      ],
      getCancelButton(user)
    ),
    t(user, "couponActivated"),
    t(user, "productAdded", {
      productName: formatProductName(user, product)
    })
  );
}

scene.use(kickHandler);
scene.use(dunnoHandler);

export const couponsScene = scene;

async function mainHandler(ctx: BotContext) {
  await withUser(
    ctx,
    async user => await displayCoupons(ctx, user)
  );
}

async function displayCoupons(ctx: BotContext, user: User) {
  const { displayCouponData, totalCount, remainingCount } = buildCouponContext(user);

  if (!totalCount) {
    await replyWithKeyboard(
      ctx,
      inlineKeyboard(getCancelButton(user)),
      t(user, "noCoupons")
    );

    return;
  }

  await replyWithKeyboard(
    ctx,
    inlineKeyboard(getCancelButton(user)),
    t(user, "couponsForProducts", {
      coupons: tWordNumber(user, "coupon", totalCount)
    }),
    ...displayCouponData.map(
      couponData => couponDescription(user, couponData)
    ),
    remainingCount
      ? t(user, "andMoreCoupons", {
        coupons: tWordNumber(user, "coupon", remainingCount)
      })
      : null
  );
}

function couponDescription(user: User, couponData: CouponData): string {
  const { coupon, activateCommand } = couponData;
  const product = getProductByCode(user, coupon.productCode);

  return text(
    compactText(
      formatProductDescription(user, product),
      bullet(
        t(user, "couponValidUntil", {
          validUntil: formatCouponExpiration(user, coupon)
        })
      )
    ),
    t(user, "activateCoupon", { activateCommand })
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
    remainingCount: totalCount - displayCount
  };
}
