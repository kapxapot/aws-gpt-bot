import { WizardContext } from "telegraf/scenes";
import { CompoundSession } from "./session";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyContext = any;

export type BotContext = WizardContext & {
  session: CompoundSession;
};
