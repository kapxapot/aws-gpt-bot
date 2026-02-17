import { StringLike, clean } from "./common";

export const cleanJoin = (lines: StringLike[], delimiter: string = "") =>
  clean(lines).join(delimiter);

/**
 * If the string ends with a period ("."), make sure that
 * only one or three periods are at the end of the string.
 */
export function squashTerminators(str: string) {
  // calculate count of terminators at the end of the string
  // if it's 2 -> make it 1
  // if it's > 3 -> make it 3
  const count = (str.match(/\.+$/) || [''])[0].length;

  if (count == 2) {
    return str.substring(0, str.length - 1);
  }

  if (count > 3) {
    return str.substring(0, str.length - (count - 3));
  }

  return str;
}

/**
 * Joins words with spaces.
 */
export const sentence = (...lines: StringLike[]) =>
  squashTerminators(cleanJoin(lines, " "));

export const text = (...lines: StringLike[]) => cleanJoin(lines, "\n\n");

export const compactText = (...lines: StringLike[]) => cleanJoin(lines, "\n");

/**
 * Sanitizes array and joins it using comma and space.
 */
export const commatize = (lines: StringLike[]) => cleanJoin(lines, ", ");

export const bullet = (line: string) => `🔹 ${line}`;

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

/**
 * a
 * a{final}b
 * a{comma}b{final}c
 * a{comma}b{comma}c{final}d
 */
export function homogeneousJoin(
  chunks: StringLike[],
  finalDelimiter: string,
  commaDelimiter: string = ", "
): string {
  let result = "";
  const cleanChunks = clean(chunks);
  const chunkCount = cleanChunks.length;

  for (let index = 1; index <= chunkCount; index++) {
    const chunk = cleanChunks[chunkCount - index];

    switch (index) {
      case 1:
        result = chunk;
        continue;

      case 2:
        result = [chunk, finalDelimiter, result].join("");
        continue;

      default:
        result = [chunk, commaDelimiter, result].join("");
    }
  }

  return result;
}
