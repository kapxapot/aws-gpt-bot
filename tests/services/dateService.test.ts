import { ts } from "../../src/entities/at";
import { addDays, addHours, addMinutes, formatDate, happened, startOfDay, startOfMonth, startOfWeek, utcStartOfDay } from "../../src/services/dateService";

describe("addDays", () => {
  test("should correctly add days", () => {
    const ts = 1682888909796; // 2023-04-30T21:08:29.796Z
    const date = addDays(ts, 30);

    expect(
      new Date(date).toISOString()
    ).toBe(
      "2023-05-30T21:08:29.796Z"
    );
  });

  test("should correctly subtract days", () => {
    const ts = 1682888909796; // 2023-04-30T21:08:29.796Z
    const date = addDays(ts, -30);

    expect(
      new Date(date).toISOString()
    ).toBe(
      "2023-03-31T21:08:29.796Z"
    );
  });
});

describe("addHours", () => {
  test("should correctly add hours", () => {
    const ts = 1682888909796; // 2023-04-30T21:08:29.796Z
    const date = addHours(ts, 3);

    expect(
      new Date(date).toISOString()
    ).toBe(
      "2023-05-01T00:08:29.796Z"
    );
  });

  test("should correctly subtract hours", () => {
    const ts = 1682888909796; // 2023-04-30T21:08:29.796Z
    const date = addHours(ts, -22);

    expect(
      new Date(date).toISOString()
    ).toBe(
      "2023-04-29T23:08:29.796Z"
    );
  });
});

describe("addMinutes", () => {
  test("should correctly add minutes", () => {
    const ts = 1682888909796; // 2023-04-30T21:08:29.796Z
    const date = addMinutes(ts, 100);

    expect(
      new Date(date).toISOString()
    ).toBe(
      "2023-04-30T22:48:29.796Z"
    );
  });

  test("should correctly subtract minutes", () => {
    const ts = 1682888909796; // 2023-04-30T21:08:29.796Z
    const date = addMinutes(ts, -30);

    expect(
      new Date(date).toISOString()
    ).toBe(
      "2023-04-30T20:38:29.796Z"
    );
  });
});

describe("utcStartOfDay", () => {
  test("should correctly calculate", () => {
    const ts = 1682888909796; // 2023-04-30T21:08:29.796Z
    const date = utcStartOfDay(ts);

    expect(
      new Date(date).toISOString()
    ).toBe(
      "2023-04-30T00:00:00.000Z"
    );
  });
});

describe("startOfDay", () => {
  test("should correctly calculate the start of day for GMT+3", () => {
    // 2023-04-30T21:08:29.796Z utc
    // 2023-05-01T00:08:29.796 gmt+3
    const ts = 1682888909796;
    const date = startOfDay(ts);

    expect(
      new Date(date).toISOString()
    ).toBe(
      "2023-04-30T21:00:00.000Z" // 2023-05-01T00:00:00 gmt+3
    );
  });
});

describe("startOfWeek", () => {
  test("should correctly calculate the start of week for GMT+3", () => {
    // 2024-04-04T21:08:29.796Z utc
    const ts = 1712264909796;
    const date = startOfWeek(ts);

    expect(
      new Date(date).toISOString()
    ).toBe(
      "2024-03-31T21:00:00.000Z"
    );
  });
});

describe("startOfMonth", () => {
  test("should correctly calculate the start of month for GMT+3", () => {
    // 2024-03-14T21:08:29.796Z utc
    const ts = 1710450509796;
    const date = startOfMonth(ts);

    expect(
      new Date(date).toISOString()
    ).toBe(
      "2024-02-29T21:00:00.000Z"
    );
  });
});

describe("formatDate", () => {
  test("should correctly format date for GMT+3", () => {
    const ts = 1682888909796; // 2023-04-30T21:08:29.796Z
    const date = startOfDay(ts);

    expect(
      formatDate(date, "dd.MM.yyyy HH:mm")
    ).toBe(
      "01.05.2023 00:00"
    );
  });
});

describe("happened", () => {
  test("should be true if the event has happened", () => {
    const now = ts();
    const interval = 5000; // ms
    const elapsed = interval + 1000;
    const start = now - elapsed;

    expect(happened(start, interval, now)).toBe(true);
  });

  test("should be true if the event has just happened (edge case)", () => {
    const now = ts();
    const interval = 5000; // ms
    const start = now - interval;

    expect(happened(start, interval, now)).toBe(true);
  });

  test("should be false if the event has not happened yet", () => {
    const now = ts();
    const interval = 5000; // ms
    const elapsed = interval - 1;
    const start = now - elapsed;

    expect(happened(start, interval, now)).toBe(false);
  });
});
