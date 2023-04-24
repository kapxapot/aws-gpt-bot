import { Markup } from 'telegraf';
import { BaseScene } from 'telegraf/scenes';
import { BotContext } from '../context';

export const promptSceneName = "PROMPT_SCENE";

export const promptScene = new BaseScene<BotContext>(promptSceneName);

promptScene.enter((ctx) => {
  ctx.reply("What is your drug?", Markup.inlineKeyboard([
    Markup.button.callback("Movie", "MOVIE_ACTION"),
    Markup.button.callback("Theater", "THEATER_ACTION"),
  ]));
});

promptScene.action("THEATER_ACTION", (ctx) => {
  ctx.reply("You choose theater");
  return ctx.scene.leave();
});

promptScene.action("MOVIE_ACTION", (ctx) => {
  ctx.reply("You choose movie, your loss");
  return ctx.scene.leave();
});

promptScene.leave((ctx) => {
  ctx.reply("Thank you for your time!");
});

// What to do if user entered a raw message or picked some other option?
promptScene.use((ctx) => ctx.reply("Please choose either Movie or Theater"));
