import { Entity } from "../lib/types";
import { CompoundSession } from "../telegram/session";

export type Session = Entity & {
  value: CompoundSession;
};
