import { BaseScene } from "telegraf/scenes";
import { BotContext } from "../botContext";
import { scenes, settings, symbols } from "../../lib/constants";
import { ButtonLike, clearAndLeave, clearInlineKeyboard, encodeText, inlineKeyboard, reply, replyWithKeyboard } from "../../lib/telegram";
import { backToCustomPrompt, getOrAddUser, newCustomPrompt, setFreeMode, setPrompt } from "../../services/userService";
import { getModeByCode, getModeName, getModes, getPromptByCode, getPrompts, modeCodes, promptCodes } from "../../entities/prompt";
import { addSceneCommandHandlers, backToChatHandler, dunnoHandler, kickHandler } from "../handlers";
import { message } from "telegraf/filters";
import { replyBackToMainDialog, sendMessageToGpt, withUser } from "../../services/messageService";
import { ModeStage, SessionData } from "../session";
import { cancelAction, getCancelButton } from "../../lib/dialog";
import { t } from "../../lib/translate";

const scene = new BaseScene<BotContext>(scenes.mode);

const selectFreeModeAction = "select-free-mode";
const customPromptAction = "custom-prompt";
const backToCustomPromptAction = "back-to-custom-prompt";

scene.enter(modeSelectionHandler);

async function modeSelectionHandler(ctx: BotContext) {
  setStage(ctx.session, "modeSelection");

  await withUser(ctx, async user => {
    const messages = [
      t(user, "currentMode", {
        modeName: getModeName(user)
      }),
      t(user, "chooseMode")
    ];

    const buttons = [];

    getModes(user).forEach(mode => {
      buttons.push([mode.name, mode.code]);
    })

    buttons.push(getCancelButton(user));

    await replyWithKeyboard(
      ctx,
      inlineKeyboard(...buttons),
      ...messages
    );
  });
}

addSceneCommandHandlers(scene);

scene.action(cancelAction, async ctx => {
  if (isStage(ctx.session, "modeSelection")) {
    await backToChatHandler(ctx);
    return;
  }

  await clearInlineKeyboard(ctx);
  await modeSelectionHandler(ctx);
});

modeCodes.forEach(modeCode => {
  scene.action(modeCode, async ctx => {
    if (isStage(ctx.session, "modeSelection")) {
      await withUser(ctx, async user => {
        await clearInlineKeyboard(ctx);

        const mode = getModeByCode(user, modeCode);

        if (!mode) {
          const errorMessage = t(user, "modeNotFound", { modeCode });
          console.error(errorMessage);
          await replyBackToMainDialog(ctx, errorMessage);

          return;
        }

        const messages = [
          t(user, "modeName", {
            modeName: mode.name
          }),
          mode.description
        ];

        const buttons: ButtonLike[] = [];

        switch (modeCode) {
          case "free":
            buttons.push([
              t(user, "chooseThisMode"),
              selectFreeModeAction
            ]);

            break;

          case "role":
            setStage(ctx.session, "roleSelection");

            messages.push(
              t(user, "chooseRole")
            );

            getPrompts(user).forEach(p => {
              buttons.push([p.name, p.code]);
            });

            break;

          case "prompt":
            setStage(ctx.session, "promptSelection");

            // eslint-disable-next-line no-case-declarations
            const customPrompt = user.context?.customPrompt;

            if (customPrompt) {
              messages.push(
                t(user, "existingCustomPrompt", {
                  customPrompt: encodeText(customPrompt)
                })
              );

              buttons.push([
                t(user, "switchBackToPrompt"),
                backToCustomPromptAction
              ]);
            }

            buttons.push([
              t(user, "enterNewPrompt"),
              customPromptAction
            ]);

            break;
        }

        buttons.push(getCancelButton(user));

        await replyWithKeyboard(
          ctx,
          inlineKeyboard(...buttons),
          ...messages
        );
      });
    }
  });
});

scene.action(selectFreeModeAction, async ctx => {
  await withUser(ctx, async user => {
    await setFreeMode(user);

    await replyBackToMainDialog(
      ctx,
      `Вы перешли в режим <b>«${getModeName(user)}»</b>.`
    );
  });
});

promptCodes.forEach(promptCode => {
  scene.action(promptCode, async ctx => {
    if (isStage(ctx.session, "roleSelection")) {
      await withUser(ctx, async user => {
        const prompt = getPromptByCode(user, promptCode);

        if (!prompt) {
          const errorMessage = t(user, "promptNotFound", { promptCode });
          console.error(errorMessage);
          await replyBackToMainDialog(ctx, errorMessage);

          return;
        }

        await setPrompt(user, prompt);

        await replyBackToMainDialog(
          ctx,
          `Вы выбрали роль <b>«${prompt.name}»</b>.`,
          prompt.intro
        );
      });
    }
  });
});

scene.action(customPromptAction, async ctx => {
  await clearInlineKeyboard(ctx);

  setStage(ctx.session, "customPromptInput");

  await withUser(ctx, async user => {
    await replyWithKeyboard(
      ctx,
      inlineKeyboard(getCancelButton(user)),
      `Введите новый промт (до ${settings.maxPromptLength} символов):`
    );
  });
});

scene.action(backToCustomPromptAction, async ctx => {
  await withUser(ctx, async user => {
    await backToCustomPrompt(user);

    await replyBackToMainDialog(
      ctx,
      "Вы вернулись к своему промту."
    );
  });
});

scene.on(message("text"), async ctx => {
  if (isStage(ctx.session, "customPromptInput")) {
    await clearAndLeave(ctx);

    // switch to new custom prompt
    const customPrompt = ctx.message.text;

    const { user } = await getOrAddUser(ctx.from);
    await newCustomPrompt(user, customPrompt);

    await reply(ctx, `${symbols.success} Вы задали новый промт.`);
    await sendMessageToGpt(ctx, user, customPrompt);

    return;
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
