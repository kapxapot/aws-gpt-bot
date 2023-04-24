import { Message } from "./message";
import { History } from "./history";
import { customPromptCode } from "./prompt";

const userMessageCacheSize = 3;

export interface IContext {
  customPrompt: string | null;
  promptCode: string;
  history: History[];
}

export class Context {
  public customPrompt: string | null;
  public promptCode: string;
  public history: History[];

  constructor(customPrompt: string);
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
    return this.history.find(h => h.promptCode === promptCode)
      ?? this.createHistory(promptCode);
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
