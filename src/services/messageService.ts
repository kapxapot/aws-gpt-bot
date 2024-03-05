import { ts } from "../entities/at";
import { getModeName } from "../entities/prompt";
import { User } from "../entities/user";
import { gptChatCompletion } from "../external/gptChatCompletion";
import { truncate } from "../lib/common";
import { isSuccess } from "../lib/error";
import { clearAndLeave, encodeText, reply } from "../lib/telegram";
import { storeMessage } from "../storage/messageStorage";
import { addMessageToUser, getLastHistoryMessage, getOrAddUser, getUserGptModel, incMessageUsage, isMessageLimitExceeded, stopWaitingForGptAnswer, waitForGptAnswer } from "./userService";
import { commands } from "../lib/constants";
import { formatUserSubscription } from "./subscriptionService";
import { getCurrentHistory } from "./contextService";
import { getCaseByNumber } from "../lib/cases";
import { Completion } from "../entities/message";
import { putMetric } from "./metricService";
import { isDebugMode } from "./userSettingsService";
import { gptTimeout } from "./gptService";
import { happened } from "./dateService";
import { AnyContext } from "../telegram/botContext";
import { getMessageLimitString } from "./messageLimitService";

const config = {
  messageInterval: parseInt(process.env.THROTTLE_TIMEOUT ?? "30"), // seconds
};

export async function sendMessageToGpt(ctx: AnyContext, user: User, question: string, requestedAt?: number) {
  const lastMessageAt = user.usageStats?.lastMessageAt;

  if (user.waitingForGptAnswer) {
    if (lastMessageAt && happened(lastMessageAt.timestamp, gptTimeout * 1000)) {
      // we have waited enough for the GPT answer
      await stopWaitingForGptAnswer(user);
    } else {
      await reply(ctx, "Я обрабатываю ваше предыдущее сообщение, подождите... ⏳");
      return;
    }
  }

  if (await isMessageLimitExceeded(user)) {
    await reply(
      ctx,
      "Вы превысили лимит сообщений на сегодня. 😥",
      `Приходите завтра или перейдите на тариф с более высоким лимитом: /${commands.premium}`
    );

    return;
  }

  if (config.messageInterval > 0 && lastMessageAt) {
    const elapsed = (ts() - lastMessageAt.timestamp) / 1000;
    const diff = Math.round(config.messageInterval - elapsed);

    if (diff > 0) {
      await reply(
        ctx,
        `Вы отправляете сообщения слишком часто. Подождите ${diff} ${getCaseByNumber("секунда", diff)}... ⏳`
      );

      return;
    }
  }

  const messages = await reply(ctx, "🤔 Думаю над ответом, подождите... ⏳");

  await waitForGptAnswer(user);
  const answer = await gptChatCompletion(user, question);
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

    await incMessageUsage(user, message.requestedAt);
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
    isSuccess(answer) ? answer : null
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
  await reply(ctx, `Текущий тариф: ${formatUserSubscription(user)}`);
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

export async function showInfo(ctx: AnyContext, user: User, answer: Completion | null) {
  const chunks = [];

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
        chunks.push(
          encodeText(
            `история: ${messages.map(m => `[${truncate(m.request, 20)}]`).join(", ")}`
          )
        );
      } else {
        chunks.push("история пуста");
      }
    }

    chunks.push(`модель запроса: ${getUserGptModel(user)}`);

    if (answer?.model) {
      chunks.push(`модель ответа: ${answer.model}`);
    }
  }

  if (user.usageStats) {
    chunks.push(`сообщений сегодня: ${user.usageStats.messageCount}/${getMessageLimitString(user)}`);
  }

  await reply(ctx, chunks.join(", "));
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
