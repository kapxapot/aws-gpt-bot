type Like<T> = T | null | undefined;
export type StringLike = Like<string>;

export function clean(lines: StringLike[]) {
  return lines
    .map(l => l ? l.trim() : "")
    .filter(l => !!l);
}

export function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === null || isUndefined(value)) {
    return [];
  }
  
  return Array.isArray(value) ? value : [value];
}

export const toCleanArray = (lines: string | string[]) =>
  clean(toArray(lines));

export function first<T>(array: T[]): T | null {
  return !isEmpty(array) ? array[0] : null;
}

export function last<T>(array: T[]): T | null {
  return !isEmpty(array) ? array[array.length - 1] : null;
}

export function phoneToItu(phone: string | undefined): string | null {
  if (!phone) {
    return null;
  }

  return phone.replace(/\D/g, '') || null;
}

export function isNumeric(str: string): boolean {
  return /^\d+$/.test(str);
}

export function isNumber(v: unknown): v is number {
  return typeof v === "number";
}

export function isUndefined(v: unknown): v is undefined {
  return typeof v === "undefined";
}

export const isEmpty = <T>(array?: T[]) => !array || !array.length;

export function toFixedOrIntStr(num: number, digits?: number): string {
  const fixed = num.toFixed(digits);

  if (!digits || digits === 0) {
    return fixed;
  }

  const fixedNum = Number(fixed);
  const truncated = Math.trunc(fixedNum);
  const fraction = fixedNum - truncated;

  let epsilon = 1;

  for (let i = 0; i < digits; i++) {
    epsilon /= 10;
  }

  console.log([num, digits, fixed, fixedNum, truncated, fraction, epsilon]);

  return (toFixed(fraction, digits) < epsilon)
    ? String(truncated)
    : fixed;
}

export function toFixed(num: number, digits?: number): number {
  return Number(num.toFixed(digits));
}
