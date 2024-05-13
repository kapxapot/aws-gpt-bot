import { Scenes, Telegraf, session } from "telegraf";
import { message } from "telegraf/filters";
import { TelegramRequest } from "../entities/telegramRequest";
import { clearAndLeave, parseCommandWithArgs, reply, userName } from "../lib/telegram";
import { getOrAddUser } from "../services/userService";
import { tutorialScene } from "./scenes/tutorialScene";
import { BotContext } from "./botContext";
import { commands, scenes } from "../lib/constants";
import { getCommandHandlers, kickHandler, remindHandler } from "./handlers";
import { premiumScene } from "./scenes/premiumScene";
import { User } from "../entities/user";
import { inspect } from "util";
import { getUserOrLeave, notAllowedMessage, sendMessageToGpt, showStatus } from "../services/messageService";
import { modeScene } from "./scenes/modeScene";
import { getUsersCount, updateUser } from "../storage/userStorage";
import { putMetric } from "../services/metricService";
import { isDebugMode } from "../services/userSettingsService";
import { Update } from "telegraf/types";
import { sessionStore } from "./sessionStore";
import { imageScene } from "./scenes/imageScene";
import { gotoPremiumAction, remindAction } from "../lib/dialog";
import { toCompactText } from "../lib/common";
import { bulletize } from "../lib/text";
import { couponsScene } from "./scenes/couponsScene";
import { canUseGpt } from "../services/permissionService";

const config = {
  botToken: process.env.BOT_TOKEN!,
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
    const user = await getOrAddUser(ctx.from);
    const newUser = !user.context;

    if (newUser) {
      const { args } = parseCommandWithArgs(ctx.message.text);

      if (args.length) {
        await updateUser(
          user,
          {
            source: args[0]
          }
        );
      }

      await reply(
        ctx,
        `Привет, <b>${userName(ctx.from)}</b>! 🤖 Я — <b>GPToid</b>, бот, созданный помогать вам в работе с <b>ChatGPT</b>!`,
        toCompactText(
          "Здесь вы можете работать с моделями <b>GPT-3.5 Turbo</b>, <b>GPT-4 Turbo</b> и <b>DALL-E 3</b>.",
          ...bulletize(
            `Советуем начать с обучения /${commands.tutorial}, если вы новичок в <b>ChatGPT</b> и <b>DALL-E</b>.`,
            `Также у меня есть разные режимы работы: /${commands.mode}`,
            `А еще вы можете приобрести пакеты услуг /${commands.premium} для увеличения числа запросов к <b>GPT-3.5</b> и получения доступа к <b>GPT-4</b> и <b>DALL-E</b>.`
          )
        ),
        `Вы всегда можете обратиться к нам с вопросами или идеями: /${commands.support}`
      );

      await putMetric("UserRegistered");
      await putMetric("UsersTotal", await getUsersCount());
    } else {
      await reply(
        ctx,
        `С возвращением, <b>${userName(ctx.from)}</b>! Продолжаем общение с <b>ChatGPT</b>. 💫`
      );

      await showStatus(ctx, user);
    }
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

    const user = await getUserOrLeave(ctx);

    if (isDebugMode(user)) {
      await reply(
        ctx,
        "Ошибка:",
        inspect(err)
      );
    }
  });

  await bot.handleUpdate(tgRequest.request as Update);
}

export async function sendTelegramMessage(user: User, message: string) {
  const bot = getBot();

  await bot.telegram.sendMessage(
    user.telegramId,
    message,
    {
      parse_mode: "HTML"
    }
  );
}

function getBot() {
  return new Telegraf<BotContext>(
    config.botToken,
    {
      handlerTimeout: config.timeout
    }
  );
}
