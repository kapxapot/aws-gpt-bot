import { Message } from "./message";
import { ModeCode, customPromptCode, getDefaults, getPromptByCode, noPromptCode } from "./prompt";

export interface History {
  promptCode: string;
  messages: Message[];
}

export interface Context {
  modeCode: ModeCode;
  customPrompt: string | null;
  promptCode: string;
  history: History[];
}

export function createContext(): Context {
  const { modeCode, promptCode } = getDefaults();

  return {
    modeCode,
    customPrompt: null,
    promptCode: promptCode,
    history: [createHistory(promptCode)]
  };
}

export function addMessageToHistory(context: Context, message: Message, historySize: number) {
  const history = getCurrentHistory(context);
  history.messages.push(message);
  history.messages = history.messages.slice(historySize * -1);
}

export function getCurrentPrompt(context: Context): string | null {
  const code = context.promptCode;

  if (code === noPromptCode) {
    return null;
  }

  if (code == customPromptCode) {
    return context.customPrompt;
  }

  return getPromptByCode(code)?.content ?? null;
}

export function getCurrentHistory(context: Context): History {
  return getOrCreateHistory(context);
}

function getOrCreateHistory(context: Context): History {
  const promptCode = context.promptCode;
  let historyEntry = context.history.find(h => h.promptCode === promptCode);

  if (!historyEntry) {
    historyEntry = createHistory(promptCode);
    context.history.push(historyEntry);
  }

  return historyEntry;
}

function createHistory(promptCode: string) {
  return {
    promptCode,
    messages: []
  };
}
