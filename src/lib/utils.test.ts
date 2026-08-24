import { describe, expect, it } from "vitest";
import { arrEq, fmtTime, shuffle } from "./utils";

describe("arrEq", () => {
  it("ignores selection order — the user can tick multi-answers in any order", () => {
    expect(arrEq([0, 2], [2, 0])).toBe(true);
  });

  it("matches identical arrays and empty arrays", () => {
    expect(arrEq([1], [1])).toBe(true);
    expect(arrEq([], [])).toBe(true);
  });

  it("rejects different content or length", () => {
    expect(arrEq([0, 1], [0, 2])).toBe(false);
    expect(arrEq([0], [0, 1])).toBe(false);
    expect(arrEq([0, 1], [0])).toBe(false);
  });
});

describe("shuffle", () => {
  it("returns a permutation of the input", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = shuffle(input);
    expect([...out].sort((a, b) => a - b)).toEqual(input);
  });

  it("never mutates or returns the input array (practice order is reusable)", () => {
    const input = [1, 2, 3, 4, 5];
    const snapshot = [...input];
    const out = shuffle(input);
    expect(input).toEqual(snapshot);
    expect(out).not.toBe(input);
  });

  it("handles trivial arrays", () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle([7])).toEqual([7]);
  });
});

describe("fmtTime", () => {
  it("formats mm:ss with zero padding", () => {
    expect(fmtTime(0)).toBe("00:00");
    expect(fmtTime(59)).toBe("00:59");
    expect(fmtTime(60)).toBe("01:00");
    expect(fmtTime(605)).toBe("10:05");
  });

  it("shows full exam duration as 120:00 (no hour rollover)", () => {
    expect(fmtTime(120 * 60)).toBe("120:00");
  });
});
