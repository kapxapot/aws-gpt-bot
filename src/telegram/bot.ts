import { Scenes, Telegraf, session } from "telegraf";
import { message } from "telegraf/filters";
import { isCompletion, isCompletionError } from "../entities/message";
import { TelegramRequest } from "../entities/telegramRequest";
import { chatCompletion } from "../gpt/chatCompletion";
import { isDebugMode, timestamp } from "../lib/common";
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

export default function processTelegramRequest(tgRequest: TelegramRequest) {
  const token = process.env.BOT_TOKEN!;
  const bot = new Telegraf<BotContext>(token);

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
    const answer = await chatCompletion(question, prompt, latestMessages);

    const reply = isCompletionError(answer)
      ? answer.error
      : answer.reply;

    await ctx.reply(reply ?? "Нет ответа от ChatGPT. 😣");

    const message = await storeMessage(
      user,
      question,
      answer,
      tgRequest.createdAt,
      timestamp()
    );

    await addMessageToUser(user, message);

    if (isDebugMode()) {
      const chunks = [];

      if (user.context) {
        chunks.push(`промт: ${user.context.promptCode}`);
      }

      if (isCompletion(answer) && answer.usage) {
        const usg = answer.usage;
        chunks.push(`токены: ${usg.totalTokens} (${usg.promptTokens} + ${usg.completionTokens})`);
      }

      await ctx.reply(chunks.join(", "));
    }
  });

  bot.use(kickHandler);

  bot.catch((err, ctx) => {
    console.log(`Bot error (${ctx.updateType}).`, err);
  });

  bot.handleUpdate(tgRequest.request);
}
