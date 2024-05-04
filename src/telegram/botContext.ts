import { WizardContext } from "telegraf/scenes";
import { CompoundSession } from "./session";

export type BotContext = WizardContext & {
  session: CompoundSession;
};
