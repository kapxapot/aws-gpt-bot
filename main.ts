import http from "serverless-http";
import { Telegraf } from "telegraf";
import chatCompletion from "./src/chatCompletion";
import { userName } from "./src/lib/common";

const token = process.env.BOT_TOKEN!;
const bot = new Telegraf(token);

bot.start(ctx => {
  console.log(ctx.from);
  ctx.reply(`Добро пожаловать, ${userName(ctx)}! Здесь можно пообщаться с ИИ GPT-3.`);
})

bot.on("text", async ctx => {
  const text = ctx.message.text;
  const gptReply = await chatCompletion(text);

  ctx.reply(gptReply ?? "Нет ответа от OpenAI API. :(");
});

bot.catch((err, ctx) => {
  console.log(`Ooops, encountered an error for ${ctx.updateType}`, err);
});

export const gpt = http(bot.webhookCallback("/telegraf"));
