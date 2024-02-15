import { Message } from "./message";
import { ModeCode } from "./prompt";

export type History = {
  promptCode: string;
  messages: Message[];
};

export type Context = {
  modeCode: ModeCode;
  customPrompt: string | null;
  promptCode: string;
  history: History[];
};
