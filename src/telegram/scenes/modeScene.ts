import { BaseScene } from "telegraf/scenes";
import { BotContext } from "../botContext";
import { commands, scenes, settings } from "../../lib/constants";
import { ButtonLike, clearInlineKeyboard, inlineKeyboard, reply, replyBackToMainDialog, replyWithKeyboard } from "../../lib/telegram";
import { backToCustomPrompt, getOrAddUser, newCustomPrompt, setFreeMode, setPrompt } from "../../services/userService";
import { getModeName, getModes, getPrompts } from "../../entities/prompt";
import { addOtherCommandHandlers, backToChatHandler, dunnoHandler, kickHandler } from "../handlers";
import { message } from "telegraf/filters";
import { getUserOrLeave } from "../../services/messageService";
import { ModeStage, SessionData } from "../session";
import { cancelAction, cancelButton } from "../../lib/dialog";

const scene = new BaseScene<BotContext>(scenes.mode);

const selectFreeModeAction = "select-free-mode";
const customPromptAction = "custom-prompt";
const backToCustomPromptAction = "back-to-custom-prompt";

scene.enter(modeSelectionHandler);

async function modeSelectionHandler(ctx: BotContext) {
  setStage(ctx.session, "modeSelection");

  const user = await getUserOrLeave(ctx);

  if (!user) {
    return;
  }

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

scene.action(cancelAction, async ctx => {
  if (isStage(ctx.session, "modeSelection")) {
    await backToChatHandler(ctx);
    return;
  }

  await clearInlineKeyboard(ctx);
  await modeSelectionHandler(ctx);
});

getModes().forEach(mode => {
  scene.action(mode.code, async ctx => {
    if (isStage(ctx.session, "modeSelection") && ctx.from) {
      await clearInlineKeyboard(ctx);

      const messages = [
        `Режим <b>«${mode.name}»</b>`,
        mode.description
      ];

      const buttons: ButtonLike[] = [];

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

          // eslint-disable-next-line no-case-declarations
          const user = await getOrAddUser(ctx.from);
          // eslint-disable-next-line no-case-declarations
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

scene.action(selectFreeModeAction, async ctx => {
  const user = await getUserOrLeave(ctx);

  if (!user) {
    return;
  }

  await setFreeMode(user);

  await replyBackToMainDialog(
    ctx,
    `Вы перешли в режим <b>«${getModeName(user)}»</b>.`
  );
});

getPrompts().forEach(prompt => {
  scene.action(prompt.code, async ctx => {
    if (isStage(ctx.session, "roleSelection") && ctx.from) {
      // set prompt
      const user = await getOrAddUser(ctx.from);
      await setPrompt(user, prompt);

      await replyBackToMainDialog(
        ctx,
        `Вы выбрали роль <b>«${prompt.name}»</b>.`,
        prompt.intro
      );
    }
  });
});

scene.action(customPromptAction, async ctx => {
  await clearInlineKeyboard(ctx);

  setStage(ctx.session, "customPromptInput");

  await replyWithKeyboard(
    ctx,
    inlineKeyboard(cancelButton),
    `Введите новый промт (до ${settings.maxPromptLength} символов):`
  );
});

scene.action(backToCustomPromptAction, async ctx => {
  const user = await getUserOrLeave(ctx);

  if (!user) {
    return;
  }

  await backToCustomPrompt(user);

  await replyBackToMainDialog(
    ctx,
    "Вы вернулись к своему промту."
  );
});

scene.on(message("text"), async ctx => {
  if (isStage(ctx.session, "customPromptInput")) {
    // switch to new custom prompt
    const customPrompt = ctx.message.text;

    const user = await getOrAddUser(ctx.from);
    await newCustomPrompt(user, customPrompt);

    await reply(ctx, "✔ Вы задали новый промт.");
  }

  await backToChatHandler(ctx);
});

scene.leave(async ctx => {
  delete ctx.session.modeData;
});

scene.use(kickHandler);
scene.use(dunnoHandler);

export const modeScene = scene;

function setStage(session: SessionData, stage: ModeStage) {
  session.modeData = {
    ...session.modeData ?? {},
    stage
  };
}

function isStage(session: SessionData, stage: ModeStage): boolean {
  return session.modeData?.stage === stage;
}
