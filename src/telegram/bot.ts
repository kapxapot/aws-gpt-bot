import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { isCompletionError } from "../entities/message";
import { TelegramRequest } from "../entities/telegramRequest";
import { chatCompletion } from "../gpt/chatCompletion";
import { timestamp } from "../lib/common";
import { userName } from "../lib/telegram";
import { addMessageToUser, getOrAddUser, resetUserContext } from "../services/userService";
import { storeMessage } from "../storage/messages";

export default function processTelegramRequest(tgRequest: TelegramRequest) {
  const token = process.env.BOT_TOKEN!;
  const bot = new Telegraf(token);

  bot.start(ctx => {
    ctx.reply(`Добро пожаловать, ${userName(ctx.from)}! Здесь можно пообщаться с ИИ GPT-3. 🤖`);
  });

  bot.command("reset", async ctx => {
    const user = await getOrAddUser(ctx.from);

    resetUserContext(user);

    ctx.reply("Контекст диалога сброшен. Следующее ваше сообщение будет установлено в качестве промта.");
  });

  bot.on(message("text"), async ctx => {
    const user = await getOrAddUser(ctx.from);

    ctx.sendChatAction("typing");

    const question = ctx.message.text;
    const answer = await chatCompletion(question, user);

    const reply = isCompletionError(answer)
      ? answer.error
      : answer.reply;

    ctx.reply(reply ?? "Нет ответа от GPT. 😣");

    const respondedAt = timestamp();

    // store message request/response
    const message = await storeMessage(
      user,
      question,
      answer,
      tgRequest.createdAt,
      respondedAt
    );

    await addMessageToUser(user, message);
  });

  bot.catch((err, ctx) => {
    console.log(`Bot error (${ctx.updateType}).`, err);
  });

  bot.handleUpdate(tgRequest.request);
}
