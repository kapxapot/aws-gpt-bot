import { ts } from "../entities/at";
import { getModeName } from "../entities/prompt";
import { User } from "../entities/user";
import { gptChatCompletion } from "../external/gptChatCompletion";
import { capitalize, commatize, first, toText, truncate } from "../lib/common";
import { isSuccess } from "../lib/error";
import { clearAndLeave, encodeText, inlineKeyboard, reply, replyWithKeyboard } from "../lib/telegram";
import { storeMessage } from "../storage/messageStorage";
import { addMessageToUser, getLastHistoryMessage, getOrAddUser, stopWaitingForGptAnswer, updateUserProduct, waitForGptAnswer } from "./userService";
import { commands } from "../lib/constants";
import { formatSubscription, getCurrentSubscription } from "./subscriptionService";
import { getCurrentHistory } from "./contextService";
import { getCaseForNumber } from "./grammarService";
import { Completion } from "../entities/message";
import { putMetric } from "./metricService";
import { isDebugMode } from "./userSettingsService";
import { gptTimeout } from "./gptService";
import { happened, timeLeft } from "./dateService";
import { AnyContext } from "../telegram/botContext";
import { PureTextModelCode, TextModelCode } from "../entities/model";
import { incUsage, isUsageLimitExceeded } from "./usageStatsService";
import { getProductTypeDisplayName } from "./productService";
import { getTextModelByCode } from "./modelService";
import { incProductUsage } from "./productUsageService";
import { intervalPhrases, intervals } from "../entities/interval";
import { PurchasedProduct } from "../entities/product";
import { getIntervalString } from "./intervalService";
import { formatLimit } from "./usageLimitService";
import { remindButton } from "../lib/dialog";
import { getConsumptionLimits, isConsumptionLimit } from "./consumptionService";
import { ConsumptionLimit, IntervalConsumptionLimits } from "../entities/consumption";
import { getTextModelContexts } from "./modelContextService";

const config = {
  messageInterval: parseInt(process.env.MESSAGE_INTERVAL ?? "15") * 1000, // milliseconds
};

export async function sendMessageToGpt(ctx: AnyContext, user: User, question: string, requestedAt?: number) {
  const context = first(getTextModelContexts(user));

  if (!context) {
    throw new Error("Text model context is undefined.");
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

  // we check the user's usage stats if we don't use a product,
  // but fall back to the defaults
  if (!product) {
    for (const interval of intervals) {
      const phrases = intervalPhrases[interval];

      if (isUsageLimitExceeded(user, pureModelCode, interval)) {
        await reply(
          ctx,
          `Вы превысили лимит сообщений на ${phrases.current}. ${phrases.smilies}`,
          `Подождите ${phrases.next} или перейдите на тариф с более высоким лимитом: /${commands.premium}`
        );
  
        return;
      }
    }
  }

  if (config.messageInterval > 0 && lastUsedAt) {
    const seconds = Math.ceil(
      timeLeft(lastUsedAt.timestamp, config.messageInterval) / 1000
    );

    if (seconds > 0) {
      await reply(
        ctx,
        `Вы отправляете сообщения слишком часто. Подождите ${seconds} ${getCaseForNumber("секунда", seconds)}... ⏳`
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

  const formattedLimits = formatConsumptionLimits(user, product, modelCode, pureModelCode);

  const info = buildInfo(
    user,
    modelCode,
    isSuccess(answer) ? answer : null,
    formattedLimits
  );

  await reply(ctx, info);

  if (isSuccess(answer)) {
    await addMessageMetrics(answer);
  }
}

export async function showStatus(ctx: AnyContext, user: User) {
  await replyWithKeyboard(
    ctx,
    inlineKeyboard(remindButton),
    getStatusMessage(user)
  );
}

export function getStatusMessage(user: User): string {
  const subscription = getCurrentSubscription(user);

  return toText(
    `${capitalize(getProductTypeDisplayName(subscription))}: ${formatSubscription(subscription)}`,
    `Режим: <b>${getModeName(user)}</b>`
  );
}

export async function showLastHistoryMessage(ctx: AnyContext, user: User, fallbackMessage?: string) {
  const historyMessage = getLastHistoryMessage(user);

  const message = historyMessage
    ? formatGptMessage(historyMessage)
    : fallbackMessage;

  if (message) {
    await reply(ctx, message);
  }
}

export async function getUserOrLeave(ctx: AnyContext): Promise<User | null> {
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

function formatConsumptionLimits(
  user: User,
  product: PurchasedProduct | null,
  modelCode: TextModelCode,
  pureModelCode: PureTextModelCode
): string | null {
  const limits = getConsumptionLimits(user, product, modelCode, pureModelCode);

  if (!limits) {
    return null;
  }

  const what = modelCode === "gptokens" ? "гптокенов" : "запросов";

  return isConsumptionLimit(limits)
    ? formatConsumptionLimit(limits, what)
    : formatIntervalConsumptionLimits(limits, what);
}

function formatConsumptionLimit({ limit, remaining }: ConsumptionLimit, what: string): string {
  return `осталось ${what}: ${remaining}/${formatLimit(limit)}`;
}

function formatIntervalConsumptionLimits(limits: IntervalConsumptionLimits, what: string): string {
  const chunks: string[] = [];

  for (const { interval, limit, remaining } of limits) {
    chunks.push(
      `осталось ${what} в ${getIntervalString(interval, "Accusative")}: ${remaining}/${formatLimit(limit)}`
    );
  }

  return commatize(chunks);
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

function buildInfo(
  user: User,
  modelCode: TextModelCode,
  answer: Completion | null,
  formattedLimits: string | null
) {
  const model = getTextModelByCode(modelCode);
  const chunks: string[] = [];

  chunks.push(`📌 Режим: <b>${getModeName(user)}</b>`);

  if (isDebugMode(user)) {
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
  }

  if (formattedLimits) {
    chunks.push(formattedLimits);
  }

  return commatize(chunks);
}
