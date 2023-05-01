import { Message } from "./message";
import { customPromptCode } from "./prompt";

const userMessageCacheSize = 3;

export interface History {
  promptCode: string;
  messages: Message[];
}

export interface IContext {
  customPrompt: string | null;
  promptCode: string;
  history: History[];
}

export class Context implements IContext {
  public customPrompt: string | null;
  public promptCode: string;
  public history: History[];

  constructor();
  constructor(customPrompt: string | null, promptCode: string, history: History[]);
  constructor(customPrompt?: string | null, promptCode?: string, history?: History[])
  {
    this.customPrompt = customPrompt ?? null;
    this.promptCode = promptCode ?? customPromptCode;
    this.history = history ?? [this.createHistory(this.promptCode)];
  }

  static fromInterface(context: IContext): Context {
    return new Context(context.customPrompt, context.promptCode, context.history);
  }

  getCurrentHistory(): History {
    return this.getOrCreateHistory(this.promptCode);
  }

  getOrCreateHistory(promptCode: string): History {
    let historyEntry = this.history.find(h => h.promptCode === promptCode);

    if (!historyEntry) {
      historyEntry = this.createHistory(promptCode);
      this.history.push(historyEntry);
    }

    return historyEntry;
  }

  createHistory(promptCode: string) {
    return {
      promptCode,
      messages: []
    };
  }

  addMessage(message: Message) {
    const history = this.getCurrentHistory();
    history.messages.push(message);
    history.messages = history.messages.slice(userMessageCacheSize * -1);
  }
}
