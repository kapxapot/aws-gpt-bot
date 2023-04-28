import { Markup } from "telegraf";
import { BaseScene } from "telegraf/scenes";
import { message } from "telegraf/filters";
import { BotContext } from "../context";
import { commands, messages, scenes } from "../../lib/constants";
import { toText } from "../../lib/common";
import { clearInlineKeyboard, sliceButtons } from "../../lib/telegram";
import { backToCustomPrompt, getOrAddUser, newCustomPrompt, setPrompt } from "../../services/userService";
import { getPromptByCode, getPrompts } from "../../entities/prompt";
import { dunnoHandler, getOtherCommandHandlers, kickHandler } from "../handlers";

export const promptScene = getPromptScene(scenes.prompt, true);
export const strictPromptScene = getPromptScene(scenes.strictPrompt, false);

function getPromptScene(name: string, allowCancel: boolean) {
  var scene = new BaseScene<BotContext>(name);

  const customPromptAction = "custom-prompt";
  const backToCustomPromptAction = "back-to-custom-prompt";
  const promptSelectionAction = "select-prompt";
  const cancelAction = "cancel";

  const customPromptInputStage = "customPromptInput";
  const promptSelectionStage = "promptSelection";

  scene.enter(async (ctx) => {
    ctx.session.promptData = {};

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
      messages.push(
        hasCustomPrompt
          ? "Вы можете поменять промт или выбрать предустановленную роль. 👇"
          : "Вы можете задать свой промт или выбрать предустановленную роль. 👇"
      );
    } else if (roleMode) {
      messages.push(
        hasCustomPrompt
          ? "Вы можете вернуться к своему промту, задать другой промт или выбрать другую роль. 👇"
          : "Вы можете задать свой промт или выбрать другую роль. 👇"
      );
    }

    messages.push(`Если вы затрудняетесь в выборе, рекомендуем пройти обучение: /${commands.tutorial}`);

    // to do: если выбрана роль, должна быть возможность вернуться к своему промту или ввести новый

    const buttons = [];

    if (customPromptMode) {
      buttons.push(
        Markup.button.callback(
          hasCustomPrompt ? "Поменять промт" : "Задать промт",
          customPromptAction
        )
      );
    } else if (roleMode) {
      if (hasCustomPrompt) {
        buttons.push(
          Markup.button.callback("Вернуться к промту", backToCustomPromptAction)
        );
      }

      buttons.push(
        Markup.button.callback("Задать промт", customPromptAction)
      );
    }

    buttons.push(
      Markup.button.callback("Выбрать роль", promptSelectionAction)
    );

    if (allowCancel) {
      buttons.push(
        Markup.button.callback("Отмена", cancelAction)
      );
    }

    await ctx.replyWithHTML(
      toText(messages),
      Markup.inlineKeyboard(sliceButtons(buttons))
    );
  });

  getOtherCommandHandlers(commands.prompt).forEach(tuple => {
    scene.command(tuple[0], async (ctx) => {
      await clearInlineKeyboard(ctx);
      await ctx.scene.leave();
      await tuple[1](ctx);
    });
  });

  scene.action(cancelAction, async (ctx) => {
    await clearInlineKeyboard(ctx);
    await ctx.reply(messages.backToAI);
    await ctx.scene.leave();
  });

  scene.action(customPromptAction, async (ctx) => {
    await clearInlineKeyboard(ctx);

    ctx.session.promptData = {
      stage: customPromptInputStage
    };

    await ctx.reply("Введите новый промт:");
  });

  scene.action(promptSelectionAction, async (ctx) => {
    await clearInlineKeyboard(ctx);

    ctx.session.promptData = {
      stage: promptSelectionStage
    };

    const buttons = getPrompts()
      .map(p => Markup.button.callback(p.name, p.code));

    await ctx.reply(
      "Выберите роль:",
      Markup.inlineKeyboard(
        sliceButtons(buttons)
      )
    );
  });

  getPrompts().forEach(prompt => {
    scene.action(prompt.code, async (ctx) => {
      const promptData = ctx.session.promptData;

      if (promptData.stage === promptSelectionStage && ctx.from) {
        await clearInlineKeyboard(ctx);

        // set prompt
        const user = await getOrAddUser(ctx.from);
        await setPrompt(user, prompt);

        await ctx.replyWithHTML(`Вы выбрали роль <b>«${prompt.name}»</b>. ${messages.backToAI}`);
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

      await ctx.reply(`Возвращаемся к вашему промту. ${messages.backToAI}`);
      await ctx.scene.leave();

      return;
    }

    await dunnoHandler(ctx);
  });

  scene.on(message("text"), async (ctx) => {
    const promptData = ctx.session.promptData;

    if (promptData.stage === customPromptInputStage) {
      // switch to new custom prompt
      const customPrompt = ctx.message.text;

      const user = await getOrAddUser(ctx.from);
      await newCustomPrompt(user, customPrompt);

      await ctx.reply(`Ваш новый промт сохранен. ${messages.backToAI}`);
      await ctx.scene.leave();
    }
  });

  scene.use(async ctx => {
    await kickHandler(ctx);
    await dunnoHandler(ctx);
  });

  return scene;
};
