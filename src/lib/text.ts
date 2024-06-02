import { StringLike, clean } from "./common";
import { symbols } from "./constants";

export const cleanJoin = (lines: StringLike[], delimiter: string = "") =>
  clean(lines).join(delimiter);

export const sentence = (...lines: StringLike[]) => cleanJoin(lines, " ");

export const text = (...lines: StringLike[]) => cleanJoin(lines, "\n\n");

export const compactText = (...lines: StringLike[]) => cleanJoin(lines, "\n");

/**
 * Sanitizes array and joins it using comma and space.
 */
export const commatize = (lines: StringLike[]) => cleanJoin(lines, ", ");

export const bullet = (line: string) => `${symbols.bullet} ${line}`;

/**
 * Cleans the array and adds the bullet symbol to every line.
 */
export const bulletize = (...lines: StringLike[]) =>
  clean(lines)
    .map(line => bullet(line));

export function truncate(str: string, limit: number): string {
  return str.length > limit
    ? `${str.substring(0, limit)}...`
    : str;
}

export function capitalize(str: string): string {
  if (str.length < 1) {
    return str;
  }

  return str.substring(0, 1).toUpperCase() + str.substring(1);
}

export const andJoin = (...lines: StringLike[]) => homogeneousJoin(clean(lines));

export const orJoin = (...lines: StringLike[]) => homogeneousJoin(clean(lines), " или ");

function homogeneousJoin(
  chunks: string[],
  finalDelimiter?: string,
  commaDelimiter?: string
): string {
  finalDelimiter ??= " и ";
  commaDelimiter ??= ", ";

  // a
  // a и b
  // a, b и c

  let result = "";
  const chunkCount = chunks.length;

  for (let index = 1; index <= chunkCount; index++) {
    const chunk = chunks[chunkCount - index];

    switch (index) {
      case 1:
        result = chunk;
        continue;

      case 2:
        result = `${chunk}${finalDelimiter}${result}`;
        continue;

      default:
        result = `${chunk}${commaDelimiter}${result}`;
    }
  }

  return result;
}
