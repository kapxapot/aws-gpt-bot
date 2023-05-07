import { Message } from "./message";
import { getDefaultPromptCode } from "./prompt";

export interface History {
  promptCode: string;
  messages: Message[];
}

export interface Context {
  customPrompt: string | null;
  promptCode: string;
  history: History[];
}

export function createContext(): Context {
  const promptCode = getDefaultPromptCode();

  return {
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
