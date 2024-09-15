import { marked } from "marked";
import { encodeText } from "./telegram";

type Replace = {
  from: RegExp | string;
  to?: string;
};

const newLine = "\n";

export const bulletPadding = "   ";
export const bullets = ["🔹", "🔸", " ◆"] as const;

export function parse(text: string): string {
  const lines = text.split(newLine);
  const rawText = crawlLines(lines).join(newLine);

  return clean(rawText);
}

export function getBullet(level: number = 0): string {
  return bullets[level % bullets.length];
}

export function getPadding(level: number = 0): string {
  return level
    ? Array(level).fill(bulletPadding).join("")
    : "";
}

function crawlLines(lines: string[]): string[] {
  const newLines = [];

  let inCodeBlock = false;
  let codeBlockOffset = 0;
  let listOffsets: number[] = [];

  const enterCodeBlock = (language: string, offset: number) => {
    newLines.push(codeBlockStart(language));
    inCodeBlock = true;
    codeBlockOffset = offset;

    resetListState();
  };

  const exitCodeBlock = () => {
    newLines.push(codeBlockEnd());
    inCodeBlock = false;
    codeBlockOffset = 0;
  };

  const resetListState = () => {
    listOffsets = [];
  };

  const lastOffset = () => {
    return listOffsets.length
      ? listOffsets[listOffsets.length - 1]
      : 0;
  }

  for (let line of lines) {
    // code block
    const codeBlockMatch = /^(\s*)```(.*)$/.exec(line);

    if (codeBlockMatch) {
      const offset = codeBlockMatch[1].length;
      const language = codeBlockMatch[2];

      if (language.length) {
        // code block start
        if (inCodeBlock) {
          exitCodeBlock();
        }

        enterCodeBlock(language, offset);
        continue;
      }

      // code block end
      if (inCodeBlock) {
        exitCodeBlock();
        continue;
      }

      // code block start without language
      enterCodeBlock("", offset);
      continue;
    }

    if (inCodeBlock) {
      const leadingSpacesMatch = /^(\s*)\S+/.exec(line);

      if (leadingSpacesMatch) {
        const offset = leadingSpacesMatch[1].length;

        if (codeBlockOffset && offset) {
          if (offset >= codeBlockOffset) {
            line = line.substring(codeBlockOffset);
          } else {
            line = line.substring(offset);
          }
        }
      }

      newLines.push(encodeText(line));
      continue;
    }

    // list
    const listMatch = /^(\s*)(-|\*|\+|\d+\.)\s+(.+)$/.exec(line);

    if (listMatch) {
      const offset = listMatch[1].length;

      // "-", "*" or "1."
      const marker = listMatch[2];
      const content = listMatch[3];

      while (offset < lastOffset()) {
        listOffsets.pop();
      }

      if (offset > lastOffset()) {
        listOffsets.push(offset);
      }

      const level = listOffsets.length;

      const bullet = marker === "-" || marker === "*" || marker === "+"
        ? getBullet(level)
        : marker;

      newLines.push(`${getPadding(level)}${bullet} ${parseLine(content)}`);

      continue;
    }

    resetListState();

    if (line.startsWith("#")) {
      newLines.push(line.replace(/^#+\s+(.+)$/, "<b>$1</b>"));
      continue;
    }

    newLines.push(parseLine(line));
  }

  // check for unclosed code block
  if (inCodeBlock) {
    exitCodeBlock();
  }

  return newLines;
}

function parseLine(line: string): string {
  return marked.parseInline(line, { async: false });
}

function codeBlockStart(language: string): string {
  const langChunk = language ? ` class="language-${language}"` : "";
  return `<pre><code${langChunk}>`;
}

const codeBlockEnd = () => "</code></pre>";

function clean(text: string): string {
  const replaces: Replace[] = [
    {
      from: /(<pre><code( class="language-.+")?>)\n/g
    },
    {
      from: /\n(<\/code><\/pre>)/g,
    },
    { from: "<strong>", to: "<b>" },
    { from: "</strong>", to: "</b>" },
    { from: "<em>", to: "<i>" },
    { from: "</em>", to: "</i>" }
  ];

  for (const replace of replaces) {
    text = text.replaceAll(replace.from, replace.to ?? "$1");
  }

  return text;
}
