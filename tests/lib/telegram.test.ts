import { encodeText, parseCommandWithArgs, sliceText } from "../../src/lib/telegram";

describe("sliceText", () => {
  test("should not encode cyrillic characters", () => {
    const text = "абвгде.";
    const encodedText = encodeText(text);
    const slicedText = sliceText(encodedText, 20);

    expect(slicedText.length).toBe(1);
    expect(slicedText[0]).toBe(text);
  });
});

describe("encodeText", () => {
  test("should encode html tags", () => {
    const text = "<p>I am a paragraph.</p>";
    const encodedText = encodeText(text);

    expect(encodedText).toBe("&lt;p&gt;I am a paragraph.&lt;/p&gt;");
  });
});

describe("parseCommandWithArgs", () => {
  test("should parse command with no args", () => {
    const cmdWithArgs = parseCommandWithArgs("/start");

    expect(cmdWithArgs.command).toBe("start");
    expect(cmdWithArgs.args.length).toBe(0);
  });

  test("should parse command with no args and trim it", () => {
    const cmdWithArgs = parseCommandWithArgs("   /start  ");

    expect(cmdWithArgs.command).toBe("start");
    expect(cmdWithArgs.args.length).toBe(0);
  });

  test("should parse command with one arg and spaces", () => {
    const cmdWithArgs = parseCommandWithArgs("/temp 1");

    expect(cmdWithArgs.command).toBe("temp");
    expect(cmdWithArgs.args[0]).toBe("1");
  });

  test("should parse command with several arg and whitespace", () => {
    const cmdWithArgs = parseCommandWithArgs("/ababa  1.4   come on  ");

    expect(cmdWithArgs.command).toBe("ababa");
    expect(cmdWithArgs.args[0]).toBe("1.4");
    expect(cmdWithArgs.args[1]).toBe("come");
    expect(cmdWithArgs.args[2]).toBe("on");
  });
});
