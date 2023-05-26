import { Context, History } from "../entities/context";
import { Message } from "../entities/message";
import { customPromptCode, getPromptDefaults, getPromptByCode, noPromptCode } from "../entities/prompt";

export function createContext(): Context {
  const { modeCode, promptCode } = getPromptDefaults();

  return {
    modeCode,
    customPrompt: null,
    promptCode: promptCode,
    history: [createHistory(promptCode)]
  };
}

export function addMessageToHistory(context: Context, message: Message, historySize: number) {
  if (historySize === 0) {
    return;
  }

  const history = getCurrentHistory(context);
  history.messages.push(message);
  history.messages = cutoffMessages(history, historySize);
}

export function cutoffMessages(history: History, size: number): Message[] {
  return size >= 1
    ? history.messages.slice(size * -1)
    : [];
}

export function getCurrentPrompt(context: Context): string | null {
  const code = context.promptCode;

  if (code === noPromptCode) {
    return null;
  }

  if (code === customPromptCode) {
    return context.customPrompt;
  }

  return getPromptByCode(code)?.content ?? null;
}

export function getCurrentHistory(context: Context): History {
  const promptCode = context.promptCode;
  let history = context.history.find(h => h.promptCode === promptCode);

  if (!history) {
    history = createHistory(promptCode);
    context.history.push(history);
  }

  return history;
}

function createHistory(promptCode: string) {
  return {
    promptCode,
    messages: []
  };
}
