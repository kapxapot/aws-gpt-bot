import { ts } from "../entities/at";
import { Context } from "../entities/context";
import { getPromptName } from "../entities/prompt";
import { User } from "../entities/user";
import { gptChatCompletion } from "../external/gptChatCompletion";
import { isDebugMode, truncate } from "../lib/common";
import { isError, isSuccess } from "../lib/error";
import { reply } from "../lib/telegram";
import { storeMessage } from "../storage/messageStorage";
import { addMessageToUser, getCurrentContext } from "./userService";

export async function sendMessageToGpt(ctx: any, user: User, question: string, requestedAt?: number) {
  const messages = await reply(ctx, "💬 Думаю над ответом, подождите...");

  requestedAt = requestedAt ?? ts();

  const { prompt, latestMessages } = getCurrentContext(user);
  const answer = await gptChatCompletion(question, prompt, latestMessages);

  await ctx.deleteMessage(messages[0].message_id);

  const message = await storeMessage(
    user,
    question,
    answer,
    requestedAt,
    ts()
  );

  await addMessageToUser(user, message);

  if (isSuccess(answer)) {
    await reply(
      ctx,
      answer.reply ?? "Нет ответа от ChatGPT. 😣"
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

  const context = user.context
    ? Context.fromInterface(user.context)
    : null;

  if (context) {
    chunks.push(`🟢 промт: <b>${getPromptName(context.promptCode)}</b>`);
  }

  if (usage) {
    chunks.push(`токены: ${usage.totalTokens} (${usage.promptTokens} + ${usage.completionTokens})`);
  }

  if (context) {
    const messages = context.getCurrentHistory().messages;

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
