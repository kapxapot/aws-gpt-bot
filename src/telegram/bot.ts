import { Telegraf } from "telegraf";
import chatCompletion from "../gpt/chatCompletion";
import { userName } from "../lib/common";

export default function getBot(): Telegraf {
  const token = process.env.BOT_TOKEN!;
  const bot = new Telegraf(token);

  bot.start(ctx => {
    console.log(ctx.from);
    ctx.reply(`Добро пожаловать, ${userName(ctx)}! Здесь можно пообщаться с ИИ GPT-3. 🤖`);
  })

  bot.on("text", async ctx => {
    const text = ctx.message.text;
    const gptReply = await chatCompletion(text);

    ctx.reply(gptReply ?? "Нет ответа от GPT. 😣");
  });

  bot.catch((err, ctx) => {
    console.log(`В работе бота произошла ошибка (${ctx.updateType})`, err);
  });

  return bot;
}
