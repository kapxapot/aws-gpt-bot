import { Scenes, Telegraf, session } from "telegraf";
import { message } from "telegraf/filters";
import { TelegramRequest } from "../entities/telegramRequest";
import { clearAndLeave, isTelegramError, parseCommandWithArgs, reply } from "../lib/telegram";
import { activateUser, deactivateUser, getOrAddUser, getUserName } from "../services/userService";
import { tutorialScene } from "./scenes/tutorialScene";
import { BotContext } from "./botContext";
import { commands, scenes, symbols } from "../lib/constants";
import { backToChatHandler, getCommandHandlers, kickHandler, remindHandler } from "./handlers";
import { premiumScene } from "./scenes/premiumScene";
import { User } from "../entities/user";
import { inspect } from "util";
import { notAllowedMessage, sendMessageToGpt, withUser } from "../services/messageService";
import { modeScene } from "./scenes/modeScene";
import { getUserByTelegramId, getUsersCount, updateUser } from "../storage/userStorage";
import { putMetric } from "../services/metricService";
import { isDebugMode } from "../services/userSettingsService";
import { Message, Update } from "telegraf/types";
import { sessionStore } from "./sessionStore";
import { imageScene } from "./scenes/imageScene";
import { gotoPremiumAction, remindAction } from "../lib/dialog";
import { isNumeric } from "../lib/common";
import { bulletize, compactText } from "../lib/text";
import { couponsScene } from "./scenes/couponsScene";
import { canUseGpt } from "../services/permissionService";
import { issueCoupon } from "../services/couponService";
import { decipherNumber } from "../services/cipherService";
import { Result } from "../lib/error";
import { gptDefaultModelName, gptPremiumModelName } from "../services/modelService";
import { formatCommand } from "../lib/commands";
import { t } from "../lib/translate";

const config = {
  botToken: process.env.BOT_TOKEN!,
  fanClub: process.env.SUPPORT_GROUP!,
  timeout: parseInt(process.env.TELEGRAF_TIMEOUT ?? "0") * 1000
};

export async function processTelegramRequest(tgRequest: TelegramRequest) {
  const bot = getBot();

  bot.use(session({
    store: sessionStore()
  }));

  const stage = new Scenes.Stage<BotContext>([
    tutorialScene,
    premiumScene,
    modeScene,
    imageScene,
    couponsScene
  ]);

  bot.use(stage.middleware());

  bot.start(async ctx => {
    const userResult = await getOrAddUser(ctx.from);
    let user = await activateUser(userResult.user);
    const newUser = userResult.isNew;

    const promoMessages = [
      t(user, "promo.inviteFriends", {
        inviteCommand: formatCommand(commands.invite)
      }),
      t(user, "promo.fanClub", {
        fanClubLink: `@${config.fanClub}`
      }),
      t(user, "promo.premium", {
        premiumCommand: formatCommand(commands.premium),
        gptDefaultModelName,
        gptPremiumModelName
      })
    ];

    const userName = getUserName(user);

    if (!newUser) {
      await reply(
        ctx,
        t(user, "welcomeBack", { userName }),
        compactText(
          ...bulletize(...promoMessages)
        )
      );

      await backToChatHandler(ctx);

      return;
    }

    const { args } = parseCommandWithArgs(ctx.message.text);

    if (args.length) {
      user = await processStartParam(user, args[0]);
    }

    await reply(
      ctx,
      t(user, "welcome.hello", { userName }),
      compactText(
        t(user, "welcome.models", {
          gptDefaultModelName,
          gptPremiumModelName
        }),
        ...bulletize(
          t(user, "welcome.tutorial", {
            tutorialCommand: formatCommand(commands.tutorial)
          }),
          t(user, "welcome.modes", {
            modeCommand: formatCommand(commands.mode)
          }),
          ...promoMessages
        )
      )
    );

    await putMetric("UserRegistered");
    await putMetric("UsersTotal", await getUsersCount());

    await issueCoupon(user, "welcome");
  });

  getCommandHandlers()
    .forEach(tuple => bot.command(...tuple));

  bot.action(remindAction, remindHandler);

  bot.action(gotoPremiumAction, async ctx => {
    await clearAndLeave(ctx);
    await ctx.scene.enter(scenes.premium);
  });

  bot.on(message("text"), async ctx => {
    const { user } = await getOrAddUser(ctx.from);

    if (!canUseGpt(user)) {
      await reply(
        ctx,
        notAllowedMessage(user, t(user, "chatUnavailable"))
      );

      return;
    }

    await sendMessageToGpt(ctx, user, ctx.message.text, tgRequest.createdAt);
  });

  bot.use(kickHandler);

  bot.catch(async (err, ctx) => {
    await withUser(ctx, async user => {
      console.error(
        t(user, "errors.botError", {
          updateType: ctx.updateType
        }),
        err
      );

      if (!isDebugMode(user)) {
        return;
      }

      await reply(ctx, `${symbols.cross} ${t(user, "Error")}:`, inspect(err));
    });
  });

  await bot.handleUpdate(tgRequest.request as Update);
}

export async function sendTelegramMessage(
  user: User,
  text: string
): Promise<Result<Message.TextMessage>> {
  const bot = getBot();

  try {
    const message = await bot.telegram.sendMessage(
      user.telegramId,
      text,
      {
        parse_mode: "HTML"
      }
    );

    return message;
  } catch (error) {
    console.error(error);

    if (isTelegramError(error)) {
      await deactivateUser(
        user,
        {
          reason: error.response.description,
          error
        }
      );

      return error;
    }

    return new Error(t(user, "errors.unknownTelegramError"));
  }
}

function getBot() {
  return new Telegraf<BotContext>(
    config.botToken,
    {
      handlerTimeout: config.timeout
    }
  );
}

async function processStartParam(user: User, startParam: string) {
  if (!isNumeric(startParam)) {
    // generic param - source
    return await updateUser(
      user,
      {
        source: startParam
      }
    );
  }

  // numeric param - invite
  const inviterTelegramId = decipherNumber(startParam);
  const inviter = await getUserByTelegramId(inviterTelegramId);

  if (inviter) {
    // inviter is found
    // link two users and issue a reward for the inviter
    await updateUser(
      inviter,
      {
        inviteeIds: [
          ...inviter.inviteeIds ?? [],
          user.id
        ]
      }
    );

    await sendTelegramMessage(inviter, t(user, "newInvitee"));
    await issueCoupon(inviter, "invite");

    await putMetric("UserRegisteredByInvite");

    return await updateUser(
      user,
      {
        source: "invite",
        invitedById: inviter.id
      }
    );
  }

  return user;
}
