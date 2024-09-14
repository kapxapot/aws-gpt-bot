const delimiter = "\n";

export function parse(text: string): string {
  const lines = text.split(delimiter);
  return crawlLines(lines).join(delimiter);
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

    newLines.push(parseLine(line));
  }

  // check for unclosed tags such as code block
  if (inCodeBlock) {
    newLines.push(codeBlockEnd());
  }

  return newLines;
}

function parseLine(line: string): string {
  line = parseInlineCodeblocks(line);

  return line;
}

function codeBlockStart(language: string | null = null): string {
  const langChunk = language ? ` class="language-${language}"` : "";
  return `<pre><code${langChunk}>`;
}

function codeBlockEnd(): string {
  return `</code></pre>`;
}

function parseInlineCodeblocks(text: string): string {
  return text.replace(/`([^`]+)`/g, "<code>$1</code>");
}

// function parseBold(text: string): string {
//   return text.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
// }
