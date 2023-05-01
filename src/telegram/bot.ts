import { Scenes, Telegraf, session } from "telegraf";
import { message } from "telegraf/filters";
import { TelegramRequest } from "../entities/telegramRequest";
import { gptChatCompletion } from "../external/gptChatCompletion";
import { isDebugMode, truncate } from "../lib/common";
import { reply, userName } from "../lib/telegram";
import { addMessageToUser, getCurrentContext, getOrAddUser } from "../services/userService";
import { storeMessage } from "../storage/messages";
import { sessionStore } from "./session";
import { tutorialScene } from "./scenes/tutorial";
import { BotContext } from "./context";
import { promptScene } from "./scenes/prompt";
import { commands } from "../lib/constants";
import { getCommandHandlers, kickHandler } from "./handlers";
import { premiumScene } from "./scenes/premium";
import { ts } from "../entities/at";
import { User } from "../entities/user";
import { isError, isSuccess } from "../lib/error";
import { Context } from "../entities/context";
import { inspect } from "util";
import { getPromptName } from "../entities/prompt";

const botToken = process.env.BOT_TOKEN!; 

export function processTelegramRequest(tgRequest: TelegramRequest) {
  const bot = new Telegraf<BotContext>(botToken);

  bot.use(session({
    store: sessionStore()
  }));

  const stage = new Scenes.Stage<BotContext>([tutorialScene, promptScene, premiumScene]);

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

    await ctx.sendChatAction("typing");

    const question = ctx.message.text;
    const { prompt, latestMessages } = getCurrentContext(user);
    const answer = await gptChatCompletion(question, prompt, latestMessages);

    const replyText = isError(answer)
      ? answer.message
      : answer.reply;

    await ctx.reply(replyText ?? "Нет ответа от ChatGPT. 😣");

    const message = await storeMessage(
      user,
      question,
      answer,
      tgRequest.createdAt,
      ts()
    );

    await addMessageToUser(user, message);

    if (isDebugMode()) {
      const chunks = [];

      const context = user.context
        ? Context.fromInterface(user.context)
        : null;

      if (context) {
        chunks.push(`промт: <b>${getPromptName(context.promptCode)}</b>`);
      }

      if (isSuccess(answer) && answer.usage) {
        const usg = answer.usage;
        chunks.push(`токены: ${usg.totalTokens} (${usg.promptTokens} + ${usg.completionTokens})`);
      }

      if (context) {
        const messages = context.getCurrentHistory().messages;

        if (messages.length) {
          chunks.push(`история: ${messages.map(m => `[${truncate(m.request, 20)}]`).join(", ")}`)
        } else {
          chunks.push("история пуста");
        }
      }

      await reply(
        ctx,
        chunks.join(", ")
      );
    }
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
  const bot = new Telegraf(botToken);

  await bot.telegram.sendMessage(
    user.telegramId,
    message,
    {
      parse_mode: "HTML"
    }
  );
}
