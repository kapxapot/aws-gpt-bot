import { isNumeric } from "../lib/common";

const config = {
  rotationKey: process.env.ROTATION_KEY!
};

export function cipherNumber(num: number, rotationKey?: string): string {
  const digits = numberToDigitArray(num);
  const rotation = stringToDigitArray(rotationKey ?? config.rotationKey);
  const rotatedDigits = [];

  for (let i = 0; i < digits.length; i++) {
    const rotationDigit = rotation[i % rotation.length];
    const rotatedDigit = (digits[i] + rotationDigit) % 10;

    rotatedDigits.push(rotatedDigit);
  }

  return digitArrayToString(rotatedDigits);
}

export function decipherNumber(rotatedStr: string, rotationKey?: string): number {
  const rotatedDigits = stringToDigitArray(rotatedStr);
  const rotation = stringToDigitArray(rotationKey ?? config.rotationKey);
  const digits = [];

  for (let i = 0; i < rotatedDigits.length; i++) {
    const rotationDigit = rotation[i % rotation.length];
    const digit = (10 + rotatedDigits[i] - rotationDigit) % 10;

    digits.push(digit);
  }

  return digitArrayToNumber(digits);
}

export function numberToDigitArray(num: number): number[] {
  const digits = [];
  let leftover = num;

  while (leftover > 0) {
    digits.push(leftover % 10);
    leftover = Math.floor(leftover / 10);
  }

  return digits.reverse();
}

export function stringToDigitArray(str: string): number[] {
  if (!isNumeric(str)) {
    throw new Error(`${str} is not a numeric string.`);
  }

  return [...str].map(ch => Number(ch));
}

export function digitArrayToNumber(digits: number[]): number {
  return digits.reduce((num, digit) => num * 10 + digit, 0);
}

export function digitArrayToString(digits: number[]): string {
  return digits.join("");
}
