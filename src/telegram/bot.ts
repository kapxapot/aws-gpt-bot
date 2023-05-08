import { Scenes, Telegraf, session } from "telegraf";
import { message } from "telegraf/filters";
import { TelegramRequest } from "../entities/telegramRequest";
import { isDebugMode } from "../lib/common";
import { reply, userName } from "../lib/telegram";
import { getOrAddUser } from "../services/userService";
import { sessionStore } from "./session";
import { tutorialScene } from "./scenes/tutorialScene";
import { BotContext } from "./botContext";
import { promptScene } from "./scenes/promptScene";
import { commands } from "../lib/constants";
import { getCommandHandlers, kickHandler } from "./handlers";
import { premiumScene } from "./scenes/premiumScene";
import { User } from "../entities/user";
import { inspect } from "util";
import { sendMessageToGpt } from "../services/messageService";
import { modeScene } from "./scenes/modeScene";

const config = {
  botToken: process.env.BOT_TOKEN!,
  timeout: parseInt(process.env.TELEGRAF_TIMEOUT ?? "0") * 1000
};

function getBot() {
  return new Telegraf<BotContext>(
    config.botToken,
    {
      handlerTimeout: config.timeout
    }
  );
}

export function processTelegramRequest(tgRequest: TelegramRequest) {
  const bot = getBot();

  bot.use(session({
    store: sessionStore()
  }));

  const stage = new Scenes.Stage<BotContext>([tutorialScene, promptScene, premiumScene, modeScene]);

  bot.use(stage.middleware());

  bot.start(async ctx => {
    const user = await getOrAddUser(ctx.from);
    const newUser = !user.context;

    if (newUser) {
      await reply(
        ctx,
        `Добро пожаловать, <b>${userName(ctx.from)}</b>! Здесь можно пообщаться с <b>ChatGPT</b>. 🤖 Мы используем модель <b>gpt-3.5-turbo</b>.`,
        `Рекомендуем начать с обучения /${commands.tutorial} и настройки промта /${commands.prompt}`
      );
    } else {
      await reply(
        ctx,
        `С возвращеним, <b>${userName(ctx.from)}</b>! Продолжаем общение с <b>ChatGPT</b>. 🤖 Мы используем модель <b>gpt-3.5-turbo</b>.`,
        `Для настройки промта используйте команду /${commands.prompt}`
      );
    }
  });

  getCommandHandlers().forEach(tuple => bot.command(...tuple));

  bot.on(message("text"), async ctx => {
    const user = await getOrAddUser(ctx.from);

    await sendMessageToGpt(ctx, user, ctx.message.text, tgRequest.createdAt);
  });

  bot.use(kickHandler);

  bot.catch(async (err, ctx) => {
    console.log(`Bot error (${ctx.updateType}).`, err);

    if (isDebugMode()) {
      await reply(
        ctx,
        "Ошибка:",
        inspect(err)
      )
    }
  });

  bot.handleUpdate(tgRequest.request);
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
