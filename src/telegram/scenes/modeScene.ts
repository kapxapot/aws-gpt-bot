import { BaseScene } from "telegraf/scenes";
import { BotContext, ModeStage, SessionData } from "../botContext";
import { commands, messages, scenes, settings } from "../../lib/constants";
import { clearInlineKeyboard, inlineKeyboard, reply, replyWithKeyboard } from "../../lib/telegram";
import { backToCustomPrompt, getOrAddUser, newCustomPrompt, setFreeMode, setPrompt } from "../../services/userService";
import { getModeName, getModes, getPrompts } from "../../entities/prompt";
import { addOtherCommandHandlers, dunnoHandler, kickHandler } from "../handlers";
import { message } from "telegraf/filters";
import { sendMessageToGpt, showLastHistoryMessage } from "../../services/messageService";

const scene = new BaseScene<BotContext>(scenes.mode);

const selectFreeModeAction = "select-free-mode";
const customPromptAction = "custom-prompt";
const backToCustomPromptAction = "back-to-custom-prompt";
const cancelAction = "cancel";

const cancelButton = ["Отмена", cancelAction];

scene.enter(modeSelectionHandler);

async function modeSelectionHandler(ctx: BotContext) {
  setStage(ctx.session, "modeSelection");

  if (!ctx.from) {
    await ctx.scene.leave();
    return;
  }

  const user = await getOrAddUser(ctx.from);

  const messages = [
    `Текущий режим: <b>${getModeName(user)}</b>`,
    "Выберите желаемый режим:"
  ];

  const buttons = [];

  getModes().forEach(mode => {
    buttons.push([mode.name, mode.code]);
  })

  buttons.push(cancelButton);

  await replyWithKeyboard(
    ctx,
    inlineKeyboard(...buttons),
    ...messages
  );
}

addOtherCommandHandlers(scene, commands.mode);

scene.action(cancelAction, async (ctx) => {
  await clearInlineKeyboard(ctx);

  if (isStage(ctx.session, "modeSelection")) {
    await ctx.scene.leave();
    await reply(ctx, messages.backToDialog);

    if (ctx.from) {
      const user = await getOrAddUser(ctx.from);
      await showLastHistoryMessage(ctx, user);
    }

    return;
  }

  await modeSelectionHandler(ctx);
});

getModes().forEach(mode => {
  scene.action(mode.code, async (ctx) => {
    if (isStage(ctx.session, "modeSelection") && ctx.from) {
      await clearInlineKeyboard(ctx);

      const messages = [
        `Режим <b>«${mode.name}»</b>`,
        mode.description
      ];

      const buttons = [];

      switch (mode.code) {
        case "free":
          buttons.push(["Выбрать этот режим", selectFreeModeAction]);
          break;

        case "role":
          setStage(ctx.session, "roleSelection");

          messages.push("Выберите роль:");

          getPrompts().forEach(p => {
            buttons.push([p.name, p.code]);
          });

          break;

        case "prompt":
          setStage(ctx.session, "promptSelection");

          const user = await getOrAddUser(ctx.from);
          const customPrompt = user.context?.customPrompt;

          if (customPrompt) {
            messages.push(
              "У вас есть свой промт:",
              `<i>${customPrompt}</i>`,
              "Вы можете вернуться к своему промту или задать новый."
            );

            buttons.push(["Вернуться к своему промту", backToCustomPromptAction]);
          }

          buttons.push(["Задать новый промт", customPromptAction]);

          break;
      }

      buttons.push(cancelButton);

      await replyWithKeyboard(
        ctx,
        inlineKeyboard(...buttons),
        ...messages
      );
    }
  });
});

scene.action(selectFreeModeAction, async (ctx) => {
  if (!ctx.from) {
    return;
  }

  await clearInlineKeyboard(ctx);

  // switch to free mode
  const user = await getOrAddUser(ctx.from);
  await setFreeMode(user);
  await ctx.scene.leave();

  await reply(
    ctx,
    `Вы перешли в режим <b>«${getModeName(user)}»</b>.`,
    messages.backToDialog
  );

  await showLastHistoryMessage(ctx, user);
});

getPrompts().forEach(prompt => {
  scene.action(prompt.code, async (ctx) => {
    if (isStage(ctx.session, "roleSelection") && ctx.from) {
      await clearInlineKeyboard(ctx);

      // set prompt
      const user = await getOrAddUser(ctx.from);
      await setPrompt(user, prompt);

      await reply(
        ctx,
        `Вы выбрали роль <b>«${prompt.name}»</b>.`,
        prompt.intro
      );

      await ctx.scene.leave();
      await showLastHistoryMessage(ctx, user);
    }
  });
});

scene.action(customPromptAction, async (ctx) => {
  await clearInlineKeyboard(ctx);

  setStage(ctx.session, "customPromptInput");

  await replyWithKeyboard(
    ctx,
    inlineKeyboard(cancelButton),
    `Введите новый промт (до ${settings.maxPromptLength} символов):`
  );
});

scene.action(backToCustomPromptAction, async (ctx) => {
  if (!ctx.from) {
    return;
  }

  await clearInlineKeyboard(ctx);

  // switch to old custom prompt
  const user = await getOrAddUser(ctx.from);
  await backToCustomPrompt(user);

  await reply(
    ctx,
    `Вы вернулись к своему промту. ${messages.backToDialog}`
  );

  await ctx.scene.leave();
  await showLastHistoryMessage(ctx, user);
});

scene.on(message("text"), async (ctx) => {
  if (isStage(ctx.session, "customPromptInput")) {
    await clearInlineKeyboard(ctx);

    // switch to new custom prompt
    const customPrompt = ctx.message.text;

    const user = await getOrAddUser(ctx.from);
    await newCustomPrompt(user, customPrompt);

    await reply(
      ctx,
      `Вы задали новый промт. ${messages.backToDialog}`
    );

    await ctx.scene.leave();
    await sendMessageToGpt(ctx, user, customPrompt);

    return;
  }

  await dunnoHandler(ctx);
});

scene.leave(async ctx => {
  delete ctx.session.modeData;
});

scene.use(kickHandler);
scene.use(dunnoHandler);

export const modeScene = scene;

function setStage(session: SessionData, stage: ModeStage) {
  session.modeData = { stage };
}

function isStage(session: SessionData, stage: ModeStage): boolean {
  return session.modeData?.stage === stage;
}
