export type At = {
  timestamp: number;
  date: string;
}

type CreatedAt = {
  createdAt: number;
  createdAtIso: string;
}

type UpdatedAt = {
  updatedAt: number;
  updatedAtIso: string;
}

export type TimeSpan = {
  start: number;
  end: number;
};

export type Timestamps = CreatedAt & UpdatedAt;

export const iso = (ts: number) => new Date(ts).toISOString();

/**
 * Returns a timestamp for a date string. In case of `null` string returns the current timestamp.
 */
export function ts(dateStr?: string): number {
  const date = dateStr ? new Date(dateStr) : new Date();
  return date.getTime();
}

export const at = (ts: number) => ({
  timestamp: ts,
  date: iso(ts)
});

export const now = () => at(ts());

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

export function atSort<T>(getAt: (t: T) => At): (a: T, b: T) => number {
  return (a: T, b: T) => getAt(b).timestamp - getAt(a).timestamp;
}

export function happened(then: number, compareTo?: number): boolean {
  return then <= (compareTo ?? ts());
}
