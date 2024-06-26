import { Session } from "../entities/session";
import { deleteItem, getItem, putItem } from "../lib/database";
import { Timestampless } from "../lib/types";

const sessionsTable = process.env.SESSIONS_TABLE!;

export const putSession = async (session: Timestampless<Session>): Promise<Session> =>
  await putItem<Session>(sessionsTable, session);

export const getSession = async (id: string): Promise<Session | null> =>
  await getItem<Session>(sessionsTable, id);

export const deleteSession = async (id: string): Promise<Session> =>
  await deleteItem<Session>(sessionsTable, id);
