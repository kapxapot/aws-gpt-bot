import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { TelegramRequest } from "../entities/telegramRequest";
import { chatCompletion, Completion } from "../gpt/chatCompletion";
import { timestamp } from "../lib/common";
import { userName } from "../lib/telegram";
import { getOrAddUser } from "../services/userService";
import { storeMessage } from "../storage/messages";

export default function processTelegramRequest(tgRequest: TelegramRequest) {
  const token = process.env.BOT_TOKEN!;
  const bot = new Telegraf(token);

  bot.start(ctx => {
    ctx.reply(`Добро пожаловать, ${userName(ctx.from)}! Здесь можно пообщаться с ИИ GPT-3. 🤖`);
  })

  bot.on(message("text"), async ctx => {
    ctx.sendChatAction("typing");

    const question = ctx.message.text;
    const answer = await chatCompletion(question);

    const isError = 'error' in answer;

    const reply = isError
      ? answer.error
      : answer.reply;

    ctx.reply(reply ?? "Нет ответа от GPT. 😣");

    const respondedAt = timestamp();

    // store the message in the db
    const user = await getOrAddUser(ctx.from);

    if (!user) {
      return;
    }

    // store message request/response
    await storeMessage(
      user,
      question,
      answer,
      tgRequest.createdAt,
      respondedAt
    );
  });

  bot.catch((err, ctx) => {
    console.log(`В работе бота произошла ошибка (${ctx.updateType}).`, err);
  });

  bot.handleUpdate(tgRequest.request);
}
