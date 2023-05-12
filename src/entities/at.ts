export interface At {
  timestamp: number;
  date: string;
}

interface CreatedAt {
  createdAt: number;
  createdAtIso: string;
}

interface UpdatedAt {
  updatedAt: number;
  updatedAtIso: string;
}

export interface Timestamps extends CreatedAt, UpdatedAt {
}

export type Timestampless<T extends Timestamps> = Omit<T, keyof Timestamps>;

export function iso(ts: number): string {
  return new Date(ts).toISOString();
}

/**
 * Returns a timestamp for a date string. In case of `null` string returns the current timestamp.
 */
export function ts(dateStr?: string): number {
  const date = dateStr ? new Date(dateStr) : new Date();
  return date.getTime();
}

export function at(ts: number): At {
  return {
    timestamp: ts,
    date: iso(ts)
  };
}

export function now(): At {
  return at(ts());
}

export function createdTimestamps(at?: At): CreatedAt {
  at = at ?? now();

  return {
    createdAt: at.timestamp,
    createdAtIso: at.date
  };
}

export function updatedTimestamps(at?: At): UpdatedAt {
  at = at ?? now();

  return {
    updatedAt: at.timestamp,
    updatedAtIso: at.date
  };
}

export function timestamps(at?: At): Timestamps {
  at = at ?? now();

  return {
    ...createdTimestamps(at),
    ...updatedTimestamps(at)
  };
}
