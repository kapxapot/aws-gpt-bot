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
import { GptModelCode, defaultGptModelCode } from "../entities/model";
import { getLastUsedAt, getUsageStatsReport, incUsage, isUsageLimitExceeded } from "./usageStatsService";
import { getAvailableGptModel, getProductTypeDisplayName } from "./productService";
import { getGptModelByCode, purifyGptModelCode } from "./modelService";
import { getProductUsageReport, incProductUsage } from "./productUsageService";
import { getGptModelUsagePoints } from "./modelUsageService";
import { PurchasedProduct } from "../entities/product";

const config = {
  messageInterval: parseInt(process.env.MESSAGE_INTERVAL ?? "15") * 1000, // milliseconds
};

export async function sendMessageToGpt(ctx: AnyContext, user: User, question: string, requestedAt?: number) {
  const activeProduct = getUserActiveProduct(user);

  const productModelCode = activeProduct
    ? getAvailableGptModel(activeProduct)
    : null;

  const freePlan = !activeProduct || !productModelCode;

  const modelCode = productModelCode ?? defaultGptModelCode;
  const pureModelCode = purifyGptModelCode(modelCode);
  const model = getGptModelByCode(modelCode);

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

  if (freePlan) {
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

    if (!freePlan) {
      const usagePoints = getGptModelUsagePoints(modelCode);

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

  showInfo(
    ctx,
    user,
    modelCode,
    isSuccess(answer) ? answer : null,
    freePlan ? null : activeProduct
  );

  if (isSuccess(answer)) {
    await addMessageMetrics(answer);
  }
}

async function addMessageMetrics(completion: Completion) {
  await putMetric("MessageSent");

  if (completion.usage) {
    await putMetric("TokensUsed", completion.usage.totalTokens);
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

function formatGptMessage(message: string): string {
    return `🤖 ${encodeText(message)}`;
}

export async function showInfo(
  ctx: AnyContext,
  user: User,
  modelCode: GptModelCode,
  answer: Completion | null,
  product: PurchasedProduct | null = null
) {
  const model = getGptModelByCode(modelCode);
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

  if (product) {
    const productUsageReport = getProductUsageReport(user, product, modelCode);

    if (productUsageReport) {
      chunks.push(productUsageReport);
    }
  } else {
    const freePlanUsageReport = getUsageStatsReport(user, "free", purifyGptModelCode(modelCode));

    if (freePlanUsageReport) {
      chunks.push(freePlanUsageReport);
    }
  }

  await reply(ctx, commatize(chunks));
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
