import { Scenes, Telegraf, session } from "telegraf";
import { message } from "telegraf/filters";
import { isCompletionError } from "../entities/message";
import { TelegramRequest } from "../entities/telegramRequest";
import { chatCompletion } from "../gpt/chatCompletion";
import { timestamp } from "../lib/common";
import { userName } from "../lib/telegram";
import { addMessageToUser, getCurrentContext, getOrAddUser } from "../services/userService";
import { storeMessage } from "../storage/messages";
import { sessionStore } from "./session";
import { tutorialScene, tutorialSceneName } from "./scenes/tutorial";
import { BotContext } from "./context";
import { promptScene, promptSceneName } from "./scenes/prompt";

export default function processTelegramRequest(tgRequest: TelegramRequest) {
  const token = process.env.BOT_TOKEN!;
  const bot = new Telegraf<BotContext>(token);

  bot.use(session({
    store: sessionStore()
  }));

  const stage = new Scenes.Stage<BotContext>([tutorialScene, promptScene]);

  bot.use(stage.middleware());

  bot.start(ctx => {
    ctx.reply(`Добро пожаловать, ${userName(ctx.from)}! Здесь можно пообщаться с ИИ GPT-3. 🤖`);
  });

  bot.command("terms", async ctx => {
    await ctx.reply(process.env.TERMS_URL!);
  });

  bot.command("tutorial", ctx => {
    ctx.scene.enter(tutorialSceneName);
  });

  bot.command("prompt", ctx => {
    ctx.scene.enter(promptSceneName);
  });

  bot.on(message("text"), async ctx => {
    const user = await getOrAddUser(ctx.from);

    ctx.sendChatAction("typing");

    const question = ctx.message.text;

    const { prompt, latestMessages } = getCurrentContext(user);
    const answer = await chatCompletion(question, prompt, latestMessages);

    const reply = isCompletionError(answer)
      ? answer.error
      : answer.reply;

    ctx.reply(reply ?? "Нет ответа от GPT. 😣");

    const message = await storeMessage(
      user,
      question,
      answer,
      tgRequest.createdAt,
      timestamp()
    );

    await addMessageToUser(user, message);
  });

  bot.catch((err, ctx) => {
    console.log(`Bot error (${ctx.updateType}).`, err);
  });

  bot.handleUpdate(tgRequest.request);
}
