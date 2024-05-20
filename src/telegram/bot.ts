import { Scenes, Telegraf, session } from "telegraf";
import { message } from "telegraf/filters";
import { TelegramRequest } from "../entities/telegramRequest";
import { clearAndLeave, isTelegramError, parseCommandWithArgs, reply, userName } from "../lib/telegram";
import { activateUser, desactivateUser, getOrAddUser } from "../services/userService";
import { tutorialScene } from "./scenes/tutorialScene";
import { BotContext } from "./botContext";
import { commands, scenes, symbols } from "../lib/constants";
import { backToChatHandler, getCommandHandlers, kickHandler, remindHandler } from "./handlers";
import { premiumScene } from "./scenes/premiumScene";
import { User } from "../entities/user";
import { inspect } from "util";
import { notAllowedMessage, sendMessageToGpt, withUser } from "../services/messageService";
import { modeScene } from "./scenes/modeScene";
import { getUserByTelegramId, getUsersCount, storeUser, updateUser } from "../storage/userStorage";
import { putMetric } from "../services/metricService";
import { isDebugMode } from "../services/userSettingsService";
import { Message, Update } from "telegraf/types";
import { sessionStore } from "./sessionStore";
import { imageScene } from "./scenes/imageScene";
import { gotoPremiumAction, remindAction } from "../lib/dialog";
import { isNumeric, toCompactText } from "../lib/common";
import { bulletize } from "../lib/text";
import { couponsScene } from "./scenes/couponsScene";
import { canUseGpt } from "../services/permissionService";
import { issueCoupon } from "../services/couponService";
import { decipherNumber } from "../services/cipherService";
import { Result } from "../lib/error";

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
    let user = await getUserByTelegramId(ctx.from.id)
    const newUser = user === null;

    if (!user) {
      user = await storeUser(ctx.from);
    }

    user = await activateUser(user);

    const promoMessages = [
      `Приглашайте друзей и получайте 🎁 подарки: /${commands.invite}`,
      `Также вы получите 🎁 подарок, вступив в наш фан-клуб: @${config.fanClub}, где всегда можно задать вопросы и поделиться идеями.`,
      `Приобретайте пакеты услуг /${commands.premium} для увеличения числа запросов к <b>GPT-3.5</b> и получения доступа к <b>GPT-4</b> и <b>DALL-E</b>.`
    ];

    if (!newUser) {
      await reply(
        ctx,
        `С возвращением, <b>${userName(ctx.from)}</b>!`,
        toCompactText(
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
      `Привет, <b>${userName(ctx.from)}</b>! 🤖 Я — <b>GPToid</b>, бот, созданный помогать вам в работе с <b>ChatGPT</b> и <b>DALL-E</b>!`,
      toCompactText(
        "Здесь вы можете работать с моделями <b>GPT-3.5 Turbo</b>, <b>GPT-4o</b> и <b>DALL-E 3</b>.",
        ...bulletize(
          `Советуем начать с обучения /${commands.tutorial}, если вы новичок в <b>ChatGPT</b> и <b>DALL-E</b>.`,
          `Также у меня есть разные режимы работы: /${commands.mode}`,
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
    const user = await getOrAddUser(ctx.from);

    if (!canUseGpt(user)) {
      await reply(
        ctx,
        notAllowedMessage("Диалог недоступен.")
      );

      return;
    }

    await sendMessageToGpt(ctx, user, ctx.message.text, tgRequest.createdAt);
  });

  bot.use(kickHandler);

  bot.catch(async (err, ctx) => {
    console.log(`Bot error (${ctx.updateType}).`, err);

    await withUser(ctx, async user => {
      if (!isDebugMode(user)) {
        return;
      }

      await reply(ctx, `${symbols.cross} Ошибка:`, inspect(err));
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
      await desactivateUser(
        user,
        {
          reason: error.response.description,
          error
        }
      );

      return error;
    }

    return new Error("Неизвестная ошибка при отправке сообщения в Telegram.");
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

    await sendTelegramMessage(inviter, `🔥 Новый пользователь присоединился по вашей ссылке!`);
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
