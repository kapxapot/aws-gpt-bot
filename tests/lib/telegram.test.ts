import { encodeText, sliceText } from "../../src/lib/telegram";

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
