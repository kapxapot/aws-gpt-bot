import { StringLike, clean } from "./common";
import { symbols } from "./constants";

export const bullet = (line: string) => `${symbols.bullet} ${line}`;

/**
 * Cleans the array and adds the bullet symbol to every line.
 */
export const bulletize = (...lines: StringLike[]) =>
  clean(lines)
    .map(line => bullet(line));
