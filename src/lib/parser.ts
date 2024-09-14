type Replace = {
  from: RegExp | string;
  to?: string;
};

const delimiter = "\n";
export const bullet = "▪";

export function parse(text: string): string {
  const lines = text.split(delimiter);
  const rawText = crawlLines(lines).join(delimiter);

  return clean(rawText);
}

function crawlLines(lines: string[]): string[] {
  const newLines = [];

  let inCodeBlock = false;

  for (const line of lines) {
    if (line.startsWith("```")) {
      const language = line.substring(3);

      if (language.length) {
        // code block start
        if (inCodeBlock) {
          newLines.push(codeBlockEnd());
        }

        newLines.push(codeBlockStart(language));
        inCodeBlock = true;
        continue;
      }

      // code block end
      if (inCodeBlock) {
        newLines.push(codeBlockEnd());
        inCodeBlock = false;
        continue;
      }

      // code block start without language
      newLines.push(codeBlockStart());
      inCodeBlock = true;
      continue;
    }

    if (inCodeBlock) {
      newLines.push(line);
    } else {
      newLines.push(parseLine(line));
    }
  }

  // check for unclosed tags such as code block
  if (inCodeBlock) {
    newLines.push(codeBlockEnd());
  }

  return newLines;
}

function parseLine(line: string): string {
  if (line.startsWith("#")) {
    return line.replace(/^#+\s+(.+)$/, "<b>$1</b>");
  }

  // inline code
  line = line.replace(/(\s*)-(\s+.+)/, `$1${bullet}$2`);

  // bold
  // line = line.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");

  // inline code
  line = line.replace(/`([^`]+)`/g, "<code>$1</code>");

  return line;
}

function codeBlockStart(language: string | null = null): string {
  const langChunk = language ? ` class="language-${language}"` : "";
  return `<pre><code${langChunk}>`;
}

function codeBlockEnd(): string {
  return "</code></pre>";
}

function clean(text: string): string {
  const replaces: Replace[] = [
    {
      from: /(<pre><code( class="language-.+")?>)\n/g
    },
    {
      from: /\n(<\/code><\/pre>)/g,
    }
  ];

  for (const replace of replaces) {
    text = text.replace(replace.from, replace.to ?? "$1");
  }

  return text;
}
