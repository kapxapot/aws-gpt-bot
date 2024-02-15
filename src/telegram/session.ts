import { deleteSession, getSession, putSession } from "../storage/sessionStorage";

type MaybePromise<T> = T | Promise<T>;

type Any = {} | undefined | null;

type SessionStore<T> = {
  get: (key: string) => MaybePromise<T | undefined>;
  set: (key: string, session: T) => MaybePromise<Any>;
  delete: (key: string) => MaybePromise<Any>;
}

export function sessionStore<T>(): SessionStore<T> {
  return {
    async get(key: string) {
      const session = await getSession(key);
      return session ? session.value : {};
    },
    async set(key: string, session: T) {
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
