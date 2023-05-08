import { ts } from "../entities/at";
import he from "he";
import { getCurrentHistory } from "../entities/context";
import { getModeName } from "../entities/prompt";
import { User } from "../entities/user";
import { gptChatCompletion } from "../external/gptChatCompletion";
import { isDebugMode, truncate } from "../lib/common";
import { isSuccess } from "../lib/error";
import { reply } from "../lib/telegram";
import { storeMessage } from "../storage/messageStorage";
import { addMessageToUser } from "./userService";

export async function sendMessageToGpt(ctx: any, user: User, question: string, requestedAt?: number) {
  const messages = await reply(ctx, "💬 Думаю над ответом, подождите...");

  const answer = await gptChatCompletion(user, question);

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
        ? he.encode(answer.reply)
        : "Нет ответа от ChatGPT. 😣"
    );
  } else {
    let errorMessage = answer.message;

    if (errorMessage.includes("Please reduce the length of the messages.")) {
      errorMessage = "Вы отправили слишком длинное сообщение, попробуйте его сократить.";
    } else if (errorMessage.includes("Rate limit reached")) {
      errorMessage = "Вы шлете сообщения слишком часто. Подождите несколько секунд.";
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

  await reply(
    ctx,
    chunks.join(", ")
  );
}
