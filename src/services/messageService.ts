import { ts } from "../entities/at";
import { getModeName } from "../entities/prompt";
import { User } from "../entities/user";
import { gptChatCompletion } from "../external/gptChatCompletion";
import { isDebugMode, truncate } from "../lib/common";
import { isSuccess } from "../lib/error";
import { encodeText, reply } from "../lib/telegram";
import { storeMessage } from "../storage/messageStorage";
import { addMessageToUser, getCurrentContext, gotGptAnswer, waitForGptAnswer } from "./userService";
import { commands } from "../lib/constants";
import { getFormattedPlanName, incMessageUsage, messageLimitExceeded } from "./planService";
import { getCurrentHistory } from "./contextService";
import { getCaseByNumber } from "../lib/cases";
import { Completion } from "../entities/message";
import { putMetric } from "./metricService";
import { getAllUsers } from "../storage/userStorage";
import { sendTelegramMessage } from "../telegram/bot";

const config = {
  messageInterval: parseInt(process.env.THROTTLE_TIMEOUT ?? "30"), // seconds
};

export async function sendMessageToGpt(ctx: any, user: User, question: string, requestedAt?: number) {
  if (user.waitingForGptAnswer) {
    await reply(ctx, "Я обрабатываю ваше предыдущее сообщение, подождите... ⏳");
    return;
  }

  if (await messageLimitExceeded(user)) {
    await reply(
      ctx,
      "Вы превысили лимит сообщений на сегодня. 😥",
      `Приходите завтра или перейдите на тариф с более высоким лимитом: /${commands.premium}`
    );

    return;
  }

  if (config.messageInterval > 0 && user.usageStats?.lastMessageAt) {
    const elapsed = (ts() - user.usageStats.lastMessageAt.timestamp) / 1000;
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
  await gotGptAnswer(user);

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

  if (isDebugMode(user)) {
    showDebugInfo(
      ctx,
      user,
      isSuccess(answer) ? answer.usage : null
    );
  }

  if (isSuccess(answer)) {
    await addMessageMetrics(answer);
  }
}

async function addMessageMetrics(completion: Completion) {
  await putMetric("MessageSent", 1);

  if (completion.usage) {
    await putMetric("TokensUsed", completion.usage.totalTokens);
  }
}

export async function showStatus(ctx: any, user: User) {
  await reply(ctx, `Текущий тариф: ${getFormattedPlanName(user)}`);
  await reply(ctx, `Текущий режим: <b>${getModeName(user)}</b>`);
  await showLastHistoryMessage(ctx, user);
}

export async function showLastHistoryMessage(ctx: any, user: User) {
  const { latestMessages } = getCurrentContext(user, 1);

  if (!latestMessages?.length) {
    return;
  }

  const answer = latestMessages[0].response;

  if (isSuccess(answer) && answer.reply) {
    await reply(
      ctx,
      formatGptMessage(answer.reply)
    );
  }
}

function formatGptMessage(message: string): string {
    return `🤖 ${encodeText(message)}`;
}

export async function showDebugInfo(ctx: any, user: User, usage: any) {
  const chunks = [];

  chunks.push(`👉 режим: <b>${getModeName(user)}</b>`);

  if (usage) {
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

  if (user.usageStats) {
    chunks.push(`сообщений сегодня: ${user.usageStats.messageCount}`);
  }

  await reply(ctx, chunks.join(", "));
}

export async function broadcastMessage(message: string) {
  const users = await getAllUsers();

  for (const user of users) {
    await sendTelegramMessage(user, message);
  };
}
