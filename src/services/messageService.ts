import { ts } from "../entities/at";
import { getModeName } from "../entities/prompt";
import { User } from "../entities/user";
import { gptChatCompletion } from "../external/gptChatCompletion";
import { commatize, truncate } from "../lib/common";
import { isSuccess } from "../lib/error";
import { clearAndLeave, encodeText, reply } from "../lib/telegram";
import { storeMessage } from "../storage/messageStorage";
import { addMessageToUser, getLastHistoryMessage, getOrAddUser, getUserActiveProduct, stopWaitingForGptAnswer, updateUserProduct, waitForGptAnswer } from "./userService";
import { commands } from "../lib/constants";
import { formatSubscription, getCurrentSubscription } from "./subscriptionService";
import { getCurrentHistory } from "./contextService";
import { getCaseByNumber } from "./grammarService";
import { Completion } from "../entities/message";
import { putMetric } from "./metricService";
import { isDebugMode } from "./userSettingsService";
import { gptTimeout } from "./gptService";
import { happened, timeLeft } from "./dateService";
import { AnyContext } from "../telegram/botContext";
import { TextModelCode, defaultTextModelCode } from "../entities/model";
import { getLastUsedAt, incUsage, isUsageLimitExceeded } from "./usageStatsService";
import { getAvailableTextModel, getProductTypeDisplayName } from "./productService";
import { getTextModelByCode, purifyTextModelCode } from "./modelService";
import { incProductUsage } from "./productUsageService";
import { getTextModelUsagePoints } from "./modelUsageService";
import { getUsageReport } from "./usageService";

const config = {
  messageInterval: parseInt(process.env.MESSAGE_INTERVAL ?? "15") * 1000, // milliseconds
};

export async function sendMessageToGpt(ctx: AnyContext, user: User, question: string, requestedAt?: number) {
  const activeProduct = getUserActiveProduct(user);

  const productModelCode = activeProduct
    ? getAvailableTextModel(activeProduct)
    : null;

  const usingProduct = !!activeProduct && !!productModelCode;

  const modelCode = productModelCode ?? defaultTextModelCode;
  const pureModelCode = purifyTextModelCode(modelCode);
  const model = getTextModelByCode(modelCode);

  const lastUsedAt = getLastUsedAt(user.usageStats, pureModelCode);

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
  if (!usingProduct) {
    if (isUsageLimitExceeded(user, pureModelCode, "day")) {
      await reply(
        ctx,
        "Вы превысили лимит сообщений на сегодня. 😥",
        `Подождите до завтра или перейдите на тариф с более высоким лимитом: /${commands.premium}`
      );

      return;
    }

    if (isUsageLimitExceeded(user, pureModelCode, "week")) {
      await reply(
        ctx,
        "Вы превысили лимит сообщений на эту наделю. 😥😥",
        `Подождите следующей недели или перейдите на тариф с более высоким лимитом: /${commands.premium}`
      );

      return;
    }

    if (isUsageLimitExceeded(user, pureModelCode, "month")) {
      await reply(
        ctx,
        "Вы превысили лимит сообщений на этот месяц. 😥😥😥",
        `Приходите в следующей месяце или перейдите на тариф с более высоким лимитом: /${commands.premium}`
      );

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
        `Вы отправляете сообщения слишком часто. Подождите ${seconds} ${getCaseByNumber("секунда", seconds)}... ⏳`
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

    if (usingProduct) {
      const usagePoints = getTextModelUsagePoints(modelCode);

      activeProduct.usage = incProductUsage(
        activeProduct.usage,
        modelCode,
        usagePoints
      );

      user = await updateUserProduct(user, activeProduct);
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

  const usageReport = getUsageReport(
    user,
    modelCode,
    pureModelCode,
    usingProduct ? activeProduct : null
  );

  const info = buildInfo(
    user,
    modelCode,
    isSuccess(answer) ? answer : null,
    usageReport
  );

  await reply(ctx, info);

  if (isSuccess(answer)) {
    await addMessageMetrics(answer);
  }
}

export async function showStatus(ctx: AnyContext, user: User) {
  const subscription = getCurrentSubscription(user);

  await reply(ctx, `Текущий ${getProductTypeDisplayName(subscription)}: ${formatSubscription(subscription)}`);
  await reply(ctx, `Текущий режим: <b>${getModeName(user)}</b>`);
  await showLastHistoryMessage(ctx, user);
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
  usageReport: string | null
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

  if (usageReport) {
    chunks.push(usageReport);
  }

  return commatize(chunks);
}
