import { deleteSession, getSession, putSession } from "../storage/sessionStorage";
import { CompoundSession } from "./session";

type SessionStore = {
  get: (key: string) => Promise<CompoundSession | undefined>;
  set: (key: string, session: CompoundSession) => Promise<unknown>;
  delete: (key: string) => Promise<unknown>;
}

export function sessionStore(): SessionStore {
  return {
    async get(key: string) {
      const session = await getSession(key);
      return session?.value;
    },
    async set(key: string, session: CompoundSession) {
      return await putSession({
        id: key,
        value: session
      });
    },
    async delete(key: string) {
      return await deleteSession(key);
    },
  };
}
