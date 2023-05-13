import { addDays, addHours, utcStartOfDay } from "../../src/services/dateService";

describe('addDays', () => {
  test('should correctly add days', () => {
    const ts = 1682888909796; // 2023-04-30T21:08:29.796Z
    const date = addDays(ts, 30);

    expect(
      new Date(date).toISOString()
    ).toBe(
      "2023-05-30T21:08:29.796Z"
    );
  });

  test('should correctly subtract days', () => {
    const ts = 1682888909796; // 2023-04-30T21:08:29.796Z
    const date = addDays(ts, -30);

    expect(
      new Date(date).toISOString()
    ).toBe(
      "2023-03-31T21:08:29.796Z"
    );
  });
});

describe('addHours', () => {
  test('should correctly add hours', () => {
    const ts = 1682888909796; // 2023-04-30T21:08:29.796Z
    const date = addHours(ts, 3);

    expect(
      new Date(date).toISOString()
    ).toBe(
      "2023-05-01T00:08:29.796Z"
    );
  });

  test('should correctly subtract hours', () => {
    const ts = 1682888909796; // 2023-04-30T21:08:29.796Z
    const date = addHours(ts, -22);

    expect(
      new Date(date).toISOString()
    ).toBe(
      "2023-04-29T23:08:29.796Z"
    );
  });
});

describe('utcStartOfDay', () => {
  test('should correctly calculate', () => {
    const ts = 1682888909796; // 2023-04-30T21:08:29.796Z
    const date = utcStartOfDay(ts);

    expect(
      new Date(date).toISOString()
    ).toBe(
      "2023-04-30T00:00:00.000Z"
    );
  });
});
