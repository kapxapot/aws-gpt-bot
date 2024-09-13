import { parse } from "../../src/lib/parser";

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

    expect(text).toBe(`Certainly! Here's a simple JavaScript function that returns a boolean value. This function checks if a given number is even:

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

    expect(text).toBe(`To create a regular expression that matches all symbols except the asterisk (<code>*</code>), you can use a negated character class. Here's how you can do it:

<pre><code class="language-regex">[^*]</code></pre>

### Explanation:
- <code>[</code> and <code>]</code>: These define a character class.
- <code>^</code>: When placed at the beginning of a character class, it negates the class, meaning it will match any character that is **not** listed.
- <code>*</code>: This is the character you want to exclude.

### Usage in JavaScript:
You can use this regex in JavaScript to test if a string contains any character except <code>*</code>.

<pre><code class="language-javascript">const regex = /[^*]/;

// Example usage
const testString1 = "Hello, World!"; // Contains no '*'
const testString2 = "Hello*World";    // Contains '*'

console.log(regex.test(testString1)); // true
console.log(regex.test(testString2)); // false</code></pre>

### Note:
If you want to match entire strings that contain any characters except <code>*</code>, you can use the regex in a context like this:

<pre><code class="language-javascript">const regex = /^[^*]+$/; // Matches strings that do not contain '*'

console.log(regex.test("Hello, World!")); // true
console.log(regex.test("Hello*World"));    // false</code></pre>

In this case, <code>^</code> asserts the start of the string, and <code>$</code> asserts the end of the string, ensuring the entire string is checked. The <code>+</code> ensures that there is at least one character that is not <code>*</code>.`);
  });
});
