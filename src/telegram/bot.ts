import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import chatCompletion from "../gpt/chatCompletion";
import { userName } from "../lib/telegram";
import { getOrAddUser } from "../services/userService";
import { storeMessage } from "../storage/messages";

export default function getBot(): Telegraf {
  const token = process.env.BOT_TOKEN!;
  const bot = new Telegraf(token);

  bot.start(ctx => {
    console.log(ctx.from);
    ctx.reply(`Добро пожаловать, ${userName(ctx.from)}! Здесь можно пообщаться с ИИ GPT-3. 🤖`);
  })

  bot.on(message("text"), async ctx => {
    ctx.sendChatAction("typing");

    const text = ctx.message.text;
    const gptReply = await chatCompletion(text);

    ctx.reply(gptReply ?? "Нет ответа от GPT. 😣");

    // store the message in the db
    const user = await getOrAddUser(ctx.from);

    if (!user) {
      console.log("Failed to get user.", ctx.from);
      return;
    }

    // store message request/response
    await storeMessage(user, text, gptReply);
  });

  bot.catch((err, ctx) => {
    console.log(`В работе бота произошла ошибка (${ctx.updateType}).`, err);
  });

  return bot;
}
