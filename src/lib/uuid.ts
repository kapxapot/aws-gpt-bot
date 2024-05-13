import { v4 } from "uuid";

export const uuid = () => v4();

export function getIdChunk(usedChunks: string[], id: string): string {
  const parts = id.split("-");
  let chunk = "";

  for (const part of parts) {
    chunk += part;

    if (!usedChunks.includes(chunk)) {
      break;
    }
  }

  return chunk;
}
