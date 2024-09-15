import { getBullet, getPadding, parse } from "../../src/lib/parser";

describe("parse", () => {
  test("should parse Telegram code blocks", () => {
    const text = parse(`Certainly! Here's a simple JavaScript function that returns a boolean value. This function checks if a given number is even:

\`\`\`javascript
function isEven(number) {
    return number % 2 === 0;
}
// Example usage:
console.log(isEven(4)); // true
console.log(isEven(7)); // false
\`\`\`

In this example, \`isEven\` takes a number as an argument and returns \`true\` if the number is even, and \`false\` otherwise.`);

    expect(text).toBe(`Certainly! Here&#39;s a simple JavaScript function that returns a boolean value. This function checks if a given number is even:

<pre><code class="language-javascript">function isEven(number) {
    return number % 2 === 0;
}
// Example usage:
console.log(isEven(4)); // true
console.log(isEven(7)); // false</code></pre>

In this example, <code>isEven</code> takes a number as an argument and returns <code>true</code> if the number is even, and <code>false</code> otherwise.`);
  });

  test("debug 1", () => {
    const text = parse("To create a regular expression that matches all symbols except the asterisk (`*`), you can use a negated character class. Here's how you can do it:\n\n```regex\n[^*]\n```\n\n### Explanation:\n- `[` and `]`: These define a character class.\n- `^`: When placed at the beginning of a character class, it negates the class, meaning it will match any character that is **not** listed.\n- `*`: This is the character you want to exclude.\n\n### Usage in JavaScript:\nYou can use this regex in JavaScript to test if a string contains any character except `*`.\n\n```javascript\nconst regex = /[^*]/;\n\n// Example usage\nconst testString1 = \"Hello, World!\"; // Contains no '*'\nconst testString2 = \"Hello*World\";    // Contains '*'\n\nconsole.log(regex.test(testString1)); // true\nconsole.log(regex.test(testString2)); // false\n```\n\n### Note:\nIf you want to match entire strings that contain any characters except `*`, you can use the regex in a context like this:\n\n```javascript\nconst regex = /^[^*]+$/; // Matches strings that do not contain '*'\n\nconsole.log(regex.test(\"Hello, World!\")); // true\nconsole.log(regex.test(\"Hello*World\"));    // false\n```\n\nIn this case, `^` asserts the start of the string, and `$` asserts the end of the string, ensuring the entire string is checked. The `+` ensures that there is at least one character that is not `*`.");

    expect(text).toBe(`To create a regular expression that matches all symbols except the asterisk (<code>*</code>), you can use a negated character class. Here&#39;s how you can do it:

<pre><code class="language-regex">[^*]</code></pre>

<b>Explanation:</b>
${getBullet()} <code>[</code> and <code>]</code>: These define a character class.
${getBullet()} <code>^</code>: When placed at the beginning of a character class, it negates the class, meaning it will match any character that is <b>not</b> listed.
${getBullet()} <code>*</code>: This is the character you want to exclude.

<b>Usage in JavaScript:</b>
You can use this regex in JavaScript to test if a string contains any character except <code>*</code>.

<pre><code class="language-javascript">const regex = /[^*]/;

// Example usage
const testString1 = "Hello, World!"; // Contains no '*'
const testString2 = "Hello*World";    // Contains '*'

console.log(regex.test(testString1)); // true
console.log(regex.test(testString2)); // false</code></pre>

<b>Note:</b>
If you want to match entire strings that contain any characters except <code>*</code>, you can use the regex in a context like this:

<pre><code class="language-javascript">const regex = /^[^*]+$/; // Matches strings that do not contain '*'

console.log(regex.test("Hello, World!")); // true
console.log(regex.test("Hello*World"));    // false</code></pre>

In this case, <code>^</code> asserts the start of the string, and <code>$</code> asserts the end of the string, ensuring the entire string is checked. The <code>+</code> ensures that there is at least one character that is not <code>*</code>.`);
  });

  test("debug 2", () => {
    const text = parse("regex `/([^]+)`/g` match (\\`) when (`\\`) can do it:\n- `(?<!\\\\)`: 1\n- `([^]+)`: 2\n- `` ` ``: 3");

    expect(text).toBe(`regex <code>/([^]+)</code>/g<code> match (\\</code>) when (<code>\\</code>) can do it:
${getBullet()} <code>(?&lt;!\\\\)</code>: 1
${getBullet()} <code>([^]+)</code>: 2
${getBullet()} <code>\`</code>: 3`);
  });

  test("bold", () => {
    const text = parse(`dsddjksdjkdskjsd
**sdsadaasd**
*akakasksa**
**sdkjsdfkjlf*`);

    expect(text).toBe(`dsddjksdjkdskjsd
<b>sdsadaasd</b>
<i>akakasksa</i>*
*<i>sdkjsdfkjlf</i>`
    );
  });

  test("debug 3", () => {
    const text = parse("```javascript\nconst str = `\n\\`\\`\\`javascript\nconst a = 1;\n\\`\\`\\`\n`;\n\n// Function to display the string\nfunction displayCodeSnippet(codeString) {\n    console.log(\"Here is the code snippet:\");\n    console.log(codeString);\n}\n\n// Call the function with the string\ndisplayCodeSnippet(str);\n```");

    expect(text).toBe("<pre><code class=\"language-javascript\">const str = `\n\\`\\`\\`javascript\nconst a = 1;\n\\`\\`\\`\n`;\n\n// Function to display the string\nfunction displayCodeSnippet(codeString) {\n    console.log(\"Here is the code snippet:\");\n    console.log(codeString);\n}\n\n// Call the function with the string\ndisplayCodeSnippet(str);</code></pre>");
  });

  test("parses ###", () => {
    const text = parse(`# abc 123
## abc 123
### abc 123
### abc 123
#### abc 123
##### abc 123`);

    expect(text).toBe(`<b>abc 123</b>
<b>abc 123</b>
<b>abc 123</b>
<b>abc 123</b>
<b>abc 123</b>
<b>abc 123</b>`);
  });

  test("parses list items", () => {
    const text = parse(`- abc 123
 - abc 123
  - abc 123
   - abc 123
    - abc 123
     - abc 123`);

    expect(text).toBe(`${getBullet()} abc 123
${getPadding(1)}${getBullet(1)} abc 123
${getPadding(2)}${getBullet(2)} abc 123
${getPadding(3)}${getBullet(3)} abc 123
${getPadding(4)}${getBullet(4)} abc 123
${getPadding(5)}${getBullet(5)} abc 123`);
  });

  test("debug 4", () => {
    const text = parse(`Here's a basic example of how you might implement such a function:

1. First, install \`markdown-it\` using npm:

   \`\`\`bash
   npm install markdown-it
     additional offset
  weird offset
   \`\`\`

### Explanation:
- **Markdown-It**: This library is used to parse Markdown into HTML.
- **Tag Replacement**: Since Telegram supports a limited set of HTML tags, you may need to adjust the output of \`markdown-it\` by replacing unsupported tags with supported ones.`);

    expect(text).toBe(`Here&#39;s a basic example of how you might implement such a function:

1. First, install <code>markdown-it</code> using npm:

<pre><code class="language-bash">npm install markdown-it
  additional offset
weird offset</code></pre>

<b>Explanation:</b>
${getBullet()} <b>Markdown-It</b>: This library is used to parse Markdown into HTML.
${getBullet()} <b>Tag Replacement</b>: Since Telegram supports a limited set of HTML tags, you may need to adjust the output of <code>markdown-it</code> by replacing unsupported tags with supported ones.`);
  });
});
