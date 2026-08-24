import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearMistakes,
  getMistakes,
  recordCorrectAnswer,
  recordMistake,
  removeMistake,
  subscribeMistakes,
} from "./mistakeStore";

const tick = (ms = 10) => new Promise((r) => setTimeout(r, ms));

beforeEach(async () => {
  await clearMistakes();
});

describe("mistake lifecycle", () => {
  it("stores the first miss with count/streak 1 and unresolved status", async () => {
    const before = Date.now();
    await recordMistake(7, [0, 2], "practice");

    const recs = await getMistakes();
    expect(recs).toHaveLength(1);
    expect(recs[0]).toMatchObject({
      qid: 7,
      selected: [0, 2],
      mode: "practice",
      count: 1,
      streak: 1,
      resolved: false,
    });
    expect(recs[0].firstMissedAt).toBeGreaterThanOrEqual(before);
    expect(recs[0].lastMissedAt).toBe(recs[0].firstMissedAt);
  });

  it("upserts a repeat miss instead of duplicating the record", async () => {
    await recordMistake(7, [0], "practice");
    await tick();
    // A resolved mistake that is missed again must flip back to unresolved.
    await recordCorrectAnswer(7);
    await recordMistake(7, [1], "exam");

    const recs = await getMistakes();
    expect(recs).toHaveLength(1);
    expect(recs[0]).toMatchObject({
      selected: [1],
      mode: "exam",
      count: 2,
      streak: 1,
      resolved: false,
    });
  });

  it("answering correctly resets streak but keeps the total count", async () => {
    await recordMistake(3, [2], "practice");
    await recordMistake(3, [2], "practice");
    await recordCorrectAnswer(3);

    const [rec] = await getMistakes();
    expect(rec).toMatchObject({ count: 2, streak: 0, resolved: true });
  });

  it("ignores correct answers for questions never missed", async () => {
    await recordCorrectAnswer(99);
    expect(await getMistakes()).toEqual([]);
  });
});

describe("list operations", () => {
  it("returns the most recently missed questions first", async () => {
    await recordMistake(1, [0], "practice");
    await tick(); // ensure distinct lastMissedAt timestamps
    await recordMistake(2, [0], "practice");
    await tick();
    await recordMistake(3, [0], "practice");

    const ids = (await getMistakes()).map((r) => r.qid);
    expect(ids).toEqual([3, 2, 1]);
  });

  it("removes single mistakes and clears everything", async () => {
    await recordMistake(1, [0], "practice");
    await recordMistake(2, [0], "practice");

    await removeMistake(1);
    let recs = await getMistakes();
    expect(recs.map((r) => r.qid)).toEqual([2]);

    await clearMistakes();
    recs = await getMistakes();
    expect(recs).toEqual([]);
  });
});

describe("subscribeMistakes", () => {
  it("notifies on every mutation until unsubscribed", async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeMistakes(listener);

    await recordMistake(1, [0], "practice");
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    await recordMistake(2, [0], "practice");
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe("without IndexedDB available", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("operations resolve quietly so the trainer keeps working", async () => {
    vi.resetModules();
    vi.stubGlobal("indexedDB", undefined);
    const degraded = await import("./mistakeStore");

    await expect(degraded.getMistakes()).resolves.toEqual([]);

    const listener = vi.fn();
    degraded.subscribeMistakes(listener);
    await degraded.recordMistake(1, [0], "exam");
    await degraded.recordCorrectAnswer(1);
    await degraded.removeMistake(1);
    await degraded.clearMistakes();
    expect(listener).toHaveBeenCalled();
    expect(await degraded.getMistakes()).toEqual([]);
  });
});
