import { Message } from "./message";
import { ModeCode, PromptCode } from "./prompt";

export type History = {
  promptCode: PromptCode;
  messages: Message[];
};

export type Context = {
  modeCode: ModeCode;
  customPrompt: string | null;
  promptCode: PromptCode;
  history: History[];
};
