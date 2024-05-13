import { ts } from "../entities/at";
import { getModeName } from "../entities/prompt";
import { User } from "../entities/user";
import { gptChatCompletion } from "../external/gptChatCompletion";
import { capitalize, cleanJoin, commatize, isEmpty, toCompactText, toText, truncate } from "../lib/common";
import { isSuccess } from "../lib/error";
import { clearAndLeave, encodeText, inlineKeyboard, reply, replyWithKeyboard } from "../lib/telegram";
import { storeMessage } from "../storage/messageStorage";
import { addMessageToUser, getLastHistoryMessage, getOrAddUser, getUserActiveCoupons, getUserActiveProducts, stopWaitingForGptAnswer, updateUserProduct, waitForGptAnswer } from "./userService";
import { commands, symbols } from "../lib/constants";
import { getCurrentHistory } from "./contextService";
import { formatWordNumber } from "./grammarService";
import { Completion } from "../entities/message";
import { putMetric } from "./metricService";
import { isDebugMode } from "./userSettingsService";
import { gptTimeout } from "./gptService";
import { happened, timeLeft } from "./dateService";
import { BotContext } from "../telegram/botContext";
import { TextModel, TextModelCode } from "../entities/model";
import { incUsage } from "./usageStatsService";
import { formatProductName } from "./productService";
import { incProductUsage } from "./productUsageService";
import { freeSubscription } from "../entities/product";
import { getIntervalString } from "./intervalService";
import { formatLimit } from "./usageLimitService";
import { gotoPremiumButton, remindButton } from "../lib/dialog";
import { getConsumptionLimits, isConsumptionLimit } from "./consumptionService";
import { ConsumptionLimit, ConsumptionLimits, IntervalConsumptionLimit, IntervalConsumptionLimits } from "../entities/consumption";
import { getTextModelContexts } from "./modelContextService";
import { bullet, bulletize } from "../lib/text";
import { TextModelContext } from "../entities/modelContext";
import { getSubscriptionShortDisplayName } from "./subscriptionService";
import { formatTextConsumptionLimits } from "./consumptionFormatService";
import { backToChatHandler } from "../telegram/handlers";
import { formatCouponsString } from "./couponService";

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
    if (lastUsedAt && happened(lastUsedAt.timestamp, gptTimeout * 1000)) {
      // we have waited enough for the GPT answer
      await stopWaitingForGptAnswer(user);
    } else {
      await reply(ctx, "Я обрабатываю ваше предыдущее сообщение, подождите... ⏳");
      return;
    }
  }

  if (config.messageInterval > 0 && lastUsedAt) {
    const seconds = Math.ceil(
      timeLeft(lastUsedAt.timestamp, config.messageInterval) / 1000
    );

    if (seconds > 0) {
      await reply(
        ctx,
        `Вы отправляете сообщения слишком часто. Подождите ${formatWordNumber("секунда", seconds)}... ⏳`
      );

      return;
    }
  }

  const messages = await reply(ctx, "🤔 Думаю над ответом, подождите... ⏳");

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

    await reply(
      ctx,
      answer.reply
        ? formatGptMessage(answer.reply)
        : "Нет ответа от ChatGPT. 😣"
    );

    if (product) {
      product.usage = incProductUsage(
        product.usage,
        modelCode,
        usagePoints
      );

      user = await updateUserProduct(user, product);
    }

    user = await incUsage(user, pureModelCode, message.requestedAt);

    const newLimits = getConsumptionLimits(user, product, modelCode, pureModelCode);

    const formattedLimits = newLimits
      ? formatConsumptionLimits(newLimits, modelCode)
      : null;

    await reply(
      ctx,
      commatize([
        `📌 Режим: <b>${getModeName(user)}</b>`,
        model,
        formattedLimits
      ])
    );

    if (isDebugMode(user)) {
      const debugInfo = buildDebugInfo(
        user,
        isSuccess(answer) ? answer : null,
        model
      );

      await reply(ctx, debugInfo);
    }

    await addMessageMetrics(answer);
  } else {
    let errorMessage = answer.message;

    if (errorMessage.includes("Please reduce the length of the messages.")) {
      errorMessage = "Вы отправили слишком длинное сообщение, попробуйте его сократить.";
    } else if (errorMessage.includes("Rate limit reached")) {
      errorMessage = "Вы шлете сообщения слишком часто. Подождите несколько секунд... ⏳";
    } else if (errorMessage.includes("model is currently overloaded")) {
      errorMessage = "Ой, что-то мне поплохело... 😵 Слишком большая нагрузка. Дайте отдышаться... ⏳";
    } else if (errorMessage.includes("The server had an error while processing your request")) {
      errorMessage = "Неизвестная ошибка на стороне ChatGPT. Попробуйте повторить запрос.";
    }

    await reply(ctx, `❌ ${errorMessage}`);
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

  return toText(
    ...products.map(product => formatProductName(product)),
    isEmpty(coupons) ? null : formatCouponsString(coupons),
    `Режим: <b>${getModeName(user)}</b>`
  );
}

export async function showLastHistoryMessage(ctx: BotContext, user: User, fallbackMessage?: string) {
  const historyMessage = getLastHistoryMessage(user);

  const message = historyMessage
    ? formatGptMessage(historyMessage)
    : fallbackMessage;

  if (message) {
    await reply(ctx, message);
  }
}

export async function getUserOrLeave(ctx: BotContext): Promise<User | null> {
  if (ctx.from) {
    return await getOrAddUser(ctx.from);
  }

  if (ctx.scene) {
    await clearAndLeave(ctx);
  }

  console.error(new Error("User not found (empty ctx.from)."));
  await putMetric("Error");
  await putMetric("UserNotFoundError");

  return null;
}

export async function replyBackToMainDialog(ctx: BotContext, ...lines: string[]) {
  await reply(ctx, ...lines);
  await backToChatHandler(ctx);
}

export function notAllowedMessage(message: string): string {
  return cleanJoin([
    `${symbols.stop} ${message}`,
    config.mainBot ? `Используйте основной бот: @${config.mainBot}` : null
  ]);
}

async function getTextModelContext(ctx: BotContext, user: User): Promise<TextModelContext | null> {
  const contexts = getTextModelContexts(user);
  const usableContext = contexts.find(context => context.usable);

  if (usableContext) {
    return usableContext;
  }

  const messages: string[] = [];

  for (const context of contexts) {
    const { product, modelCode, limits, usagePoints } = context;

    const formattedLimits = limits
      ? formatTextConsumptionLimits(limits, modelCode, usagePoints)
      : "неопределенный лимит";

    const subscription = product ?? freeSubscription;

    const productNameParts = [
      subscription.icon,
      capitalize(getSubscriptionShortDisplayName(subscription))
    ];

    messages.push(
      toCompactText(
        `<b>${cleanJoin(productNameParts)}</b>`,
        bullet(formattedLimits)
      )
    );
  }

  await replyWithKeyboard(
    ctx,
    inlineKeyboard(gotoPremiumButton),
    toText(...messages),
    "⛔ Запросы к ChatGPT недоступны.",
    `Подождите или приобретите пакет услуг: /${commands.premium}`
  );

  return null;
}

function formatConsumptionLimits(
  limits: ConsumptionLimits,
  modelCode: TextModelCode
): string {
  const what = modelCode === "gptokens" ? "гптокенов" : "запросов";

  return isConsumptionLimit(limits)
    ? formatConsumptionLimit(limits, what)
    : formatIntervalConsumptionLimits(limits, what);
}

function formatConsumptionLimit({ limit, remaining }: ConsumptionLimit, what: string): string {
  return `осталось ${what}: ${remaining}/${formatLimit(limit)}`;
}

function formatIntervalConsumptionLimits(
  limits: IntervalConsumptionLimits,
  what: string
): string {
  const format = ({ interval, limit, remaining }: IntervalConsumptionLimit) =>
    `в ${getIntervalString(interval, "Accusative")}: ${remaining}/${formatLimit(limit)}`;

  const chunks = limits.map(limit => format(limit));

  return `осталось ${what} ${commatize(chunks)}`;
}

async function addMessageMetrics(completion: Completion) {
  await putMetric("MessageSent");

  if (completion.usage) {
    await putMetric("TokensUsed", completion.usage.totalTokens);
  }
}

function formatGptMessage(message: string): string {
    return `🤖 ${encodeText(message)}`;
}

function buildDebugInfo(
  user: User,
  answer: Completion | null,
  model: TextModel
): string {
  const chunks: string[] = [];

  if (answer?.usage) {
    const usage = answer.usage;
    chunks.push(`токены: ${usage.totalTokens} (${usage.promptTokens} + ${usage.completionTokens})`);
  }

  const context = user.context;

  if (context) {
    const messages = getCurrentHistory(context).messages;

    if (messages.length) {
      const truncatedRequests = messages.map(m => `[${truncate(m.request, 20)}]`);

      chunks.push(
        encodeText(
          `история: ${commatize(truncatedRequests)}`
        )
      );
    } else {
      chunks.push("история пуста");
    }
  }

  chunks.push(`модель запроса: ${model}`);

  if (answer?.model) {
    chunks.push(`модель ответа: ${answer.model}`);
  }

  return toCompactText(
    "🛠 Отладка:",
    ...bulletize(...chunks)
  );
}
