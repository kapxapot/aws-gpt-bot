export function parse(text: string): string {
  text = parseMultilineCodeblocks(text);
  text = parseInlineCodeblocks(text);
  text = parseBold(text);

  return text;
}

function parseMultilineCodeblocks(text: string): string {
  return text.replace(
    /```(\w*)\n((?!```)[\s\S]+?)\n```/gm,
    (_, language, code) => {
      const langChunk = language ? ` class="language-${language}"` : "";
      return `<pre><code${langChunk}>${code}</code></pre>`;
    }
  );
}

function parseInlineCodeblocks(text: string): string {
  return text.replace(/`([^`]+)`/g, "<code>$1</code>");
}

function parseBold(text: string): string {
  return text;//.replace(/\*\*([^*])/g, '')
}
