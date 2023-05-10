import { Message } from "./message";
import { ModeCode } from "./prompt";

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
