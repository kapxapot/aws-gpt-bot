import { Composer } from "telegraf";
import { WizardScene } from "telegraf/scenes";
import { BotContext } from "../botContext";
import { clearInlineKeyboard, inlineKeyboard, reply, replyWithKeyboard } from "../../lib/telegram";
import { commands, scenes } from "../../lib/constants";
import { addSceneCommandHandlers, backToChatHandler, dunnoHandler, kickHandler } from "../handlers";
import { getDefaultImageSettings } from "../../services/imageService";
import { gptokenString } from "../../services/gptokenService";
import { getGptokenUsagePoints } from "../../services/modelUsageService";
import { gptDefaultModelName, gptPremiumModelName } from "../../services/modelService";
import { formatCommand } from "../../lib/commands";
import { User } from "../../entities/user";
import { t, tWordNumber } from "../../lib/translate";
import { withUser } from "../../services/messageService";

const imageSettings = getDefaultImageSettings();
const usagePoints = getGptokenUsagePoints(imageSettings);

const config = {
  fanClub: process.env.SUPPORT_GROUP!
};

type TextFunc = (user: User) => string;

const steps: TextFunc[] = [
  user => t(user, "tutorial.step1"),
  user => t(user, "tutorial.step2"),
  user => t(user, "tutorial.step3"),
  user => t(user, "tutorial.step3_1"),
  user => t(user, "tutorial.step4"),
  user => t(user, "tutorial.step4_1"),
  user => t(user, "tutorial.step5", {
    gptDefaultModelName,
    gptPremiumModelName,
    premiumCommand: formatCommand(commands.premium)
  }),
  user => t(user, "tutorial.step6", {
    gptDefaultModelName,
    gptPremiumModelName,
    premiumCommand: formatCommand(commands.premium),
    usageText1: tWordNumber(
      user,
      "request",
      1 / usagePoints.text,
      "Accusative"
    ),
    usageImage2: tWordNumber(
      user,
      "image",
      2 / usagePoints.image,
      "Accusative"
    ),
    imageSize: imageSettings.size,
    gptoken100: gptokenString(user, 100),
    usageText100: tWordNumber(
      user,
      "request",
      100 / usagePoints.text,
      "Accusative"
    ),
    usageImage100: tWordNumber(
      user,
      "image",
      100 / usagePoints.image,
      "Accusative"
    )
  }),
  user => t(user, "tutorial.step7", {
    fanClubLink: config.fanClub
  }),
  user => t(user, "tutorial.step8", {
    modeCommand: formatCommand(commands.mode)
  })
];

const scene = new WizardScene<BotContext>(
  scenes.tutorial,
  ...steps.map((step, index) => makeStepHandler(step, index === 0, index === steps.length - 1)),
  backToChatHandler
);

export const tutorialScene = scene;

function makeStepHandler(getText: TextFunc, first: boolean, last: boolean) {
  const stepHandler = new Composer<BotContext>();

  const nextAction = "next";
  const exitAction = "exit";

  const getKeyboard = (user: User) => inlineKeyboard(
    [t(user, "Next"), nextAction],
    [t(user, "Finish"), exitAction]
  );

  stepHandler.action(nextAction, async (ctx) => {
    await withUser(ctx, async user => {
      await clearInlineKeyboard(ctx);

      if (last) {
        await reply(ctx, getText(user));
        await ctx.scene.leave();
      } else {
        await replyWithKeyboard(ctx, getKeyboard(user), getText(user));
        ctx.wizard.next();
      }
    });
  });

  stepHandler.action(exitAction, backToChatHandler);

  if (first) {
    stepHandler.use(async (ctx) => {
      await withUser(ctx, async user => {
        await replyWithKeyboard(ctx, getKeyboard(user), getText(user));
        ctx.wizard.next();
      });
    });
  } else {
    addSceneCommandHandlers(stepHandler);

    stepHandler.use(kickHandler);
    stepHandler.use(dunnoHandler);
  }

  return stepHandler;
}
