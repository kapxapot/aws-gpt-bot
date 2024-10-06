import { ts } from "../entities/at";
import { getModeName } from "../entities/prompt";
import { User } from "../entities/user";
import { gptChatCompletion } from "../external/gptChatCompletion";
import { StringLike, toFixedOrInt } from "../lib/common";
import { isSuccess } from "../lib/error";
import { clearAndLeave, encodeText, inlineKeyboard, reply, replyWithKeyboard } from "../lib/telegram";
import { storeMessage } from "../storage/messageStorage";
import { addMessageToUser, getLastHistoryMessage, getOrAddUser, getUserActiveCoupons, getUserActiveProducts, stopWaitingForGptAnswer, updateUserProduct, waitForGptAnswer } from "./userService";
import { commands, symbols } from "../lib/constants";
import { getCurrentHistory } from "./contextService";
import { Completion } from "../entities/message";
import { putMetric } from "./metricService";
import { isDebugMode } from "./userSettingsService";
import { gptTimeout } from "./gptService";
import { isIntervalElapsed, timeLeft } from "./dateService";
import { BotContext } from "../telegram/botContext";
import { TextModel, TextModelCode } from "../entities/model";
import { incUsage } from "./usageStatsService";
import { formatProductsString } from "./productService";
import { incProductUsage } from "./productUsageService";
import { freeSubscription } from "../entities/product";
import { gotoPremiumButton, remindButton } from "../lib/dialog";
import { getConsumptionLimits } from "./consumptionService";
import { getTextModelContexts, getUsableModelContext } from "./modelContextService";
import { bullet, bulletize, commatize, sentence, compactText, text, truncate, capitalize } from "../lib/text";
import { TextModelContext } from "../entities/modelContext";
import { getPrettySubscriptionName } from "./subscriptionService";
import { formatRemainingLimits } from "./consumptionFormatService";
import { backToChatHandler } from "../telegram/handlers";
import { formatCouponsString } from "./couponService";
import { getTextModelPrices } from "./priceService";
import { gptokenString } from "./gptokenService";
import { parse } from "../lib/parser";
import { t, t0, tWordNumber } from "../lib/translate";
import { formatCommand } from "../lib/commands";

const config = {
  messageInterval: parseInt(process.env.MESSAGE_INTERVAL ?? "15") * 1000, // milliseconds
  mainBot: process.env.MAIN_BOT
};

export async function sendMessageToGpt(ctx: BotContext, user: User, question: string, requestedAt?: number) {
  const context = await getTextModelContext(ctx, user);

  if (!context) {
    return;
  }

  const {
    product,
    modelCode,
    pureModelCode,
    model,
    lastUsedAt,
    usagePoints
  } = context;

  if (user.waitingForGptAnswer) {
    if (lastUsedAt && isIntervalElapsed(lastUsedAt.timestamp, gptTimeout * 1000)) {
      // we have waited enough for the GPT answer
      await stopWaitingForGptAnswer(user);
    } else {
      await reply(ctx, t(user, "processingPreviousMessage"));
      return;
    }
  }

  if (config.messageInterval > 0 && lastUsedAt) {
    const seconds = Math.ceil(
      timeLeft(lastUsedAt.timestamp, config.messageInterval) / 1000
    );

    if (seconds > 0) {
      await reply(ctx, t(user, "sendingMessagesTooOften", {
        time: tWordNumber(user, "second", seconds)
      }));

      return;
    }
  }

  const messages = await reply(ctx, t(user, "processingRequest"));

  await waitForGptAnswer(user);
  const answer = await gptChatCompletion(user, model, question);
  await stopWaitingForGptAnswer(user);

  await ctx.deleteMessage(messages[0].message_id);

  const now = ts();

  const message = await storeMessage(
    user,
    question,
    answer,
    requestedAt ?? now,
    now
  );

  if (isSuccess(answer)) {
    await addMessageToUser(user, message);

    if (!answer.reply) {
      await reply(ctx, t(user, "noAnswerFromChatGPT"));
    } else {
      await sendParsedMessage(ctx, user, answer.reply);
    }

    const actualUsagePoints = (modelCode === "gptokens")
      ? calculateUsagePoints(answer, model)
      : usagePoints;

    if (product) {
      product.usage = incProductUsage(
        product.usage,
        modelCode,
        actualUsagePoints
      );

      user = await updateUserProduct(user, product);
    }

    user = await incUsage(user, pureModelCode, message.requestedAt);

    const newLimits = getConsumptionLimits(user, product, modelCode, pureModelCode);

    const formattedLimits = newLimits
      ? formatRemainingLimits(user, newLimits, modelCode)
      : null;

    await reply(
      ctx,
      commatize([
        `📌 ${t(user, "Mode")}: <b>${getModeName(user)}</b>`,
        model,
        formattedLimits
      ])
    );

    if (isDebugMode(user)) {
      const debugInfo = buildDebugInfo(
        user,
        isSuccess(answer) ? answer : null,
        modelCode,
        model,
        actualUsagePoints
      );

      await reply(ctx, debugInfo);
    }

    await addMessageMetrics(answer);
  } else {
    const errorMessage = adaptErrorMessage(user, answer.message);

    await reply(ctx, sentence(symbols.cross, errorMessage));
  }
}

export async function showStatus(ctx: BotContext, user: User) {
  await replyWithKeyboard(
    ctx,
    inlineKeyboard(remindButton),
    getStatusMessage(user)
  );
}

export function getStatusMessage(user: User): string {
  const products = getUserActiveProducts(user);
  const coupons = getUserActiveCoupons(user);

  return text(
    formatProductsString(user, products),
    formatCouponsString(user, coupons),
    `${t(user, "Mode")}: <b>${getModeName(user)}</b>`
  );
}

export async function showLastHistoryMessage(ctx: BotContext, user: User, fallbackMessage?: string) {
  const historyMessage = getLastHistoryMessage(user);

  if (historyMessage) {
    await sendParsedMessage(ctx, user, historyMessage);
  } else if (fallbackMessage) {
    await reply(ctx, fallbackMessage);
  }
}

export async function withUser(ctx: BotContext, func: (user: User) => Promise<void>): Promise<void> {
  const user = await getUserOrLeave(ctx);

  if (user) {
    await func(user);
  }
}

export async function getUserOrLeave(ctx: BotContext): Promise<User | null> {
  if (ctx.from) {
    const { user } = await getOrAddUser(ctx.from);
    return user;
  }

  if (ctx.scene) {
    await clearAndLeave(ctx);
  }

  const errorText = t0("errors.userNotFoundCtxFrom");
  console.error(new Error(errorText));

  await putMetric("Error");
  await putMetric("UserNotFoundError");

  return null;
}

export async function replyBackToMainDialog(ctx: BotContext, ...lines: StringLike[]) {
  await reply(ctx, ...lines);
  await backToChatHandler(ctx);
}

export function notAllowedMessage(user: User, message: string): string {
  return sentence(
    symbols.stop,
    message,
    config.mainBot ? `${t(user, "useMainBot")}: @${config.mainBot}` : null
  );
}

function adaptErrorMessage(user: User, errorMessage: string) {
  if (errorMessage.includes("Please reduce the length of the messages.")) {
    return t(user, "errors.messageTooLong");
  }

  if (errorMessage.includes("Rate limit reached")) {
    return t(user, "errors.rateLimitReached");
  }

  if (errorMessage.includes("model is currently overloaded")) {
    return t(user, "errors.modelOverloaded");
  }

  if (errorMessage.includes("The server had an error while processing your request")) {
    return t(user, "errors.chatGPTError");
  }

  if (errorMessage.includes("You exceeded your current quota")) {
    return t(user, "errors.quotaExceeded", {
      supportCommand: formatCommand(commands.support)
    });
  }

  return errorMessage;
}

async function sendParsedMessage(ctx: BotContext, user: User, message: string) {
  try {
    await reply(ctx, formatBotMessage(parse(message)));

    if (isDebugMode(user)) {
      await reply(ctx, encodeText(message));
    }
  } catch (error: unknown) {
    console.error(error);
    await reply(ctx, formatBotMessage(encodeText(message)));
  }
}

async function getTextModelContext(ctx: BotContext, user: User): Promise<TextModelContext | null> {
  const contexts = getTextModelContexts(user);
  const usableContext = getUsableModelContext(contexts);

  if (usableContext) {
    return usableContext;
  }

  const messages: string[] = [];

  for (const context of contexts) {
    const { product, modelCode, limits, usagePoints } = context;

    if (!limits) {
      continue;
    }

    const subscription = product ?? freeSubscription;
    const formattedLimits = formatRemainingLimits(user, limits, modelCode, usagePoints);

    messages.push(
      compactText(
        `<b>${getPrettySubscriptionName(subscription)}</b>`,
        bullet(capitalize(formattedLimits))
      )
    );
  }

  await replyWithKeyboard(
    ctx,
    inlineKeyboard(gotoPremiumButton),
    text(...messages),
    t(user, "chatGPTRequestsUnavailable"),
    `${t(user, "waitOrBuy")}: ${formatCommand(commands.premium)}`
  );

  return null;
}

function calculateUsagePoints(answer: Completion, model: TextModel): number {
  const prices = getTextModelPrices(model);
  const usage = answer.usage;

  if (!usage) {
    return 0;
  }

  const inPrice = usage.promptTokens * prices.inputPrice;
  const outPrice = usage.completionTokens * prices.outputPrice;

  return Math.ceil(inPrice + outPrice) * 0.001;
}

async function addMessageMetrics(completion: Completion) {
  await putMetric("MessageSent");

  if (completion.usage) {
    await putMetric("TokensUsed", completion.usage.totalTokens);
  }
}

function formatBotMessage(message: string): string {
  return `🤖 ${message}`;
}

function buildDebugInfo(
  user: User,
  answer: Completion | null,
  modelCode: TextModelCode,
  model: TextModel,
  actualUsagePoints: number
): string {
  const chunks: string[] = [];

  if (answer?.usage) {
    const usage = answer.usage;
    chunks.push(`${t(user, "tokens")}: ${usage.totalTokens} (${usage.promptTokens} + ${usage.completionTokens})`);
  }

  const formattedPoints = toFixedOrInt(actualUsagePoints, 3);

  const cost = (modelCode === "gptokens")
    ? gptokenString(user, formattedPoints)
    : formattedPoints;

  chunks.push(`${t(user, "cost")}: ${cost}`);

  const context = user.context;

  if (context) {
    const messages = getCurrentHistory(context).messages;

    if (messages.length) {
      const truncatedRequests = messages.map(m => `[${truncate(m.request, 20)}]`);

      chunks.push(
        encodeText(
          `${t(user, "history")}: ${commatize(truncatedRequests)}`
        )
      );
    } else {
      chunks.push(t(user, "emptyHistory"));
    }
  }

  chunks.push(`${t(user, "requestModel")}: ${model}`);

  if (answer?.model) {
    chunks.push(`${t(user, "responseModel")}: ${answer.model}`);
  }

  return compactText(
    `🛠 ${t(user, "Debug")}:`,
    ...bulletize(...chunks)
  );
}
