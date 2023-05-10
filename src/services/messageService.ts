import he from "he";
import { ts } from "../entities/at";
import { getCurrentHistory } from "../entities/context";
import { getModeName } from "../entities/prompt";
import { User } from "../entities/user";
import { gptChatCompletion } from "../external/gptChatCompletion";
import { isDebugMode, truncate } from "../lib/common";
import { isSuccess } from "../lib/error";
import { reply } from "../lib/telegram";
import { storeMessage } from "../storage/messageStorage";
import { addMessageToUser, gotGptAnswer, waitForGptAnswer } from "./userService";
import { commands } from "../lib/constants";
import { incMessageUsage, messageLimitExceeded } from "./planService";

export async function sendMessageToGpt(ctx: any, user: User, question: string, requestedAt?: number) {
  if (user.waitingForGptAnswer) {
    await reply(ctx, "Я обрабатываю ваше предыдущее сообщение, подождите!");
    return;
  }

  if (await messageLimitExceeded(user)) {
    await reply(
      ctx,
      `Вы превысили лимит сообщений на сегодня. 😥`,
      `Приходите завтра или перейдите на тариф с более высоким лимитом: /${commands.premium}`
    );

    return;
  }

  const messages = await reply(ctx, "💬 Думаю над ответом, подождите...");

  await waitForGptAnswer(user);
  const answer = await gptChatCompletion(user, question);
  await gotGptAnswer(user);

  await ctx.deleteMessage(messages[0].message_id);

  const message = await storeMessage(
    user,
    question,
    answer,
    requestedAt ?? ts(),
    ts()
  );

  await addMessageToUser(user, message);

  if (isSuccess(answer)) {
    await reply(
      ctx,
      answer.reply
        ? `🤖 ${he.encode(answer.reply)}`
        : "Нет ответа от ChatGPT. 😣"
    );

    await incMessageUsage(user);
  } else {
    let errorMessage = answer.message;

    if (errorMessage.includes("Please reduce the length of the messages.")) {
      errorMessage = "Вы отправили слишком длинное сообщение, попробуйте его сократить.";
    } else if (errorMessage.includes("Rate limit reached")) {
      errorMessage = "Вы шлете сообщения слишком часто. Подождите несколько секунд.";
    } else if (errorMessage.includes("model is currently overloaded")) {
      errorMessage = "Ой, что-то мне поплохело... Слишком большая нагрузка. Дайте отдышаться.";
    }

    await reply(ctx, `❌ ${errorMessage}`);
  }

  if (isDebugMode()) {
    showDebugInfo(
      ctx,
      user,
      isSuccess(answer) ? answer.usage : null
    );
  }
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
      chunks.push(`история: ${messages.map(m => `[${truncate(m.request, 20)}]`).join(", ")}`)
    } else {
      chunks.push("история пуста");
    }
  }

  if (user.usageStats) {
    chunks.push(`сообщений сегодня: ${user.usageStats.messageCount}`);
  }

  await reply(
    ctx,
    chunks.join(", ")
  );
}
