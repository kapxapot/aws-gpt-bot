import { BaseScene } from "telegraf/scenes";
import { message } from "telegraf/filters";
import { BotContext, PromptStage, SessionData } from "../context";
import { commands, messages, scenes } from "../../lib/constants";
import { toText } from "../../lib/common";
import { clearInlineKeyboard, inlineKeyboard, reply } from "../../lib/telegram";
import { backToCustomPrompt, getOrAddUser, newCustomPrompt, setPrompt } from "../../services/userService";
import { getPromptByCode, getPrompts } from "../../entities/prompt";
import { addOtherCommandHandlers, dunnoHandler, kickHandler } from "../handlers";

const scene = new BaseScene<BotContext>(scenes.prompt);

const customPromptAction = "custom-prompt";
const backToCustomPromptAction = "back-to-custom-prompt";
const promptSelectionAction = "select-prompt";
const cancelAction = "cancel";

const cancelButton = ["Отмена", cancelAction];

scene.enter(startHandler);

async function startHandler(ctx: BotContext) {
  setStage(ctx.session, "start");

  if (!ctx.from) {
    await ctx.scene.leave();
    return;
  }

  const user = await getOrAddUser(ctx.from);

  const messages = [];
  let customPromptMode = true;
  let roleMode = false;

  let hasCustomPrompt = false;

  if (user.context) {
    const customPrompt = user.context.customPrompt;
    hasCustomPrompt = !!customPrompt;

    const promptCode = user.context.promptCode;
    const prompt = getPromptByCode(promptCode);

    if (prompt) {
      customPromptMode = false;
      roleMode = true;

      messages.push(`Текущая роль: <b>«${prompt.name}»</b>`);
    }

    if (hasCustomPrompt) {
      messages.push(
        prompt ? "Также у вас есть свой промт:" : "Текущий промт:",
        `<i>${customPrompt}</i>`
      );
    }
  }

  if (customPromptMode) {
    messages.push(`Вы можете ${hasCustomPrompt ? "поменять" : "задать"} свой промт или выбрать предустановленную роль. 👇`);
  } else if (roleMode) {
    messages.push(
      hasCustomPrompt
        ? "Вы можете вернуться к своему промту, задать новый промт или выбрать другую роль. 👇"
        : "Вы можете задать свой промт или выбрать другую роль. 👇"
    );
  }

  messages.push(`Если вы затрудняетесь в выборе, рекомендуем пройти обучение: /${commands.tutorial}`);

  const buttons = [];

  if (customPromptMode) {
    buttons.push([
      hasCustomPrompt ? "Поменять свой промт" : "Задать свой промт",
      customPromptAction
    ]);
  } else if (roleMode) {
    if (hasCustomPrompt) {
      buttons.push(["Вернуться к своему промту", backToCustomPromptAction]);
    }

    buttons.push(["Задать новый промт", customPromptAction]);
  }

  buttons.push(
    ["Выбрать роль", promptSelectionAction],
    cancelButton
  );

  await ctx.replyWithHTML(
    toText(...messages),
    inlineKeyboard(...buttons)
  );
}

addOtherCommandHandlers(scene, commands.prompt);

scene.action(cancelAction, async (ctx) => {
  await clearInlineKeyboard(ctx);

  if (isStage(ctx.session, "start")) {
    await ctx.reply(messages.backToAI);
    await ctx.scene.leave();
  } else {
    await startHandler(ctx);
  }
});

scene.action(customPromptAction, async (ctx) => {
  await clearInlineKeyboard(ctx);

  setStage(ctx.session, "customPromptInput");

  await ctx.reply(
    "Введите новый промт:",
    inlineKeyboard(cancelButton)
  );
});

scene.action(promptSelectionAction, async (ctx) => {
  await clearInlineKeyboard(ctx);

  setStage(ctx.session, "promptSelection");

  if (!ctx.from) {
    await ctx.scene.leave();
    return;
  }

  const user = await getOrAddUser(ctx.from);

  const promptCode = user.context?.promptCode;

  const buttons = getPrompts()
    .filter(p => p.code !== promptCode)
    .map(p => [p.name, p.code]);

  buttons.push(cancelButton);

  await ctx.reply(
    "Выберите роль:",
    inlineKeyboard(...buttons)
  );
});

getPrompts().forEach(prompt => {
  scene.action(prompt.code, async (ctx) => {
    if (isStage(ctx.session, "promptSelection") && ctx.from) {
      await clearInlineKeyboard(ctx);

      // set prompt
      const user = await getOrAddUser(ctx.from);
      await setPrompt(user, prompt);

      await reply(
        ctx,
        `Вы выбрали роль <b>«${prompt.name}»</b>.`,
        messages.backToAI
      );

      await ctx.scene.leave();

      return;
    }

    await dunnoHandler(ctx);
  });
});

scene.action(backToCustomPromptAction, async (ctx) => {
  if (ctx.from) {
    await clearInlineKeyboard(ctx);

    // switch to old custom prompt
    const user = await getOrAddUser(ctx.from);
    await backToCustomPrompt(user);

    await reply(
      ctx,
      "Возвращаемся к вашему промту.",
      messages.backToAI
    );

    await ctx.scene.leave();

    return;
  }

  await dunnoHandler(ctx);
});

scene.on(message("text"), async (ctx) => {
  if (isStage(ctx.session, "customPromptInput")) {
    // switch to new custom prompt
    const customPrompt = ctx.message.text;

    const user = await getOrAddUser(ctx.from);
    await newCustomPrompt(user, customPrompt);

    await reply(
      ctx,
      "Ваш новый промт сохранен.",
      messages.backToAI
    );

    await ctx.scene.leave();
  }
});

scene.use(async ctx => {
  await kickHandler(ctx);
  await dunnoHandler(ctx);
});

export const promptScene = scene;

function setStage(session: SessionData, stage: PromptStage) {
  session.promptData = { stage };
}

function isStage(session: SessionData, stage: PromptStage): boolean {
  return session.promptData?.stage === stage;
}
