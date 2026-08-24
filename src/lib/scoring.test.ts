import { describe, expect, it } from "vitest";
import { computeResults } from "./scoring";
import { QUESTIONS } from "../data/questions";
import type { DomainKey } from "../types";

const firstOfDomain = (d: DomainKey) => QUESTIONS.find((q) => q.domain === d)!;

describe("computeResults", () => {
  it("empty form scores the floor of the scale and does not pass", () => {
    const r = computeResults([], {});
    expect(r).toMatchObject({ total: 0, correct: 0, pct: 0, scaled: 100, pass: false });
  });

  it("all correct → scaled 1000, pass", () => {
    const form = [firstOfDomain("D1").id];
    const answers = { [form[0]]: firstOfDomain("D1").correct };
    const r = computeResults(form, answers);
    expect(r).toMatchObject({ total: 1, correct: 1, pct: 1, scaled: 1000, pass: true });
  });

  it("unanswered questions count as incorrect", () => {
    const d1 = firstOfDomain("D1");
    const d2 = firstOfDomain("D2");
    const r = computeResults([d1.id, d2.id], { [d1.id]: d1.correct });
    expect(r.correct).toBe(1);
    expect(r.total).toBe(2);
    expect(r.scaled).toBe(550);
    expect(r.pass).toBe(false);
  });

  it("multi-answer selections must match exactly (order-independent)", () => {
    const multi = QUESTIONS.find((q) => q.type === "multi")!;
    const partial = computeResults([multi.id], { [multi.id]: multi.correct.slice(0, 1) });
    const reordered = computeResults([multi.id], { [multi.id]: [...multi.correct].reverse() });
    expect(partial.correct).toBe(0);
    expect(reordered.correct).toBe(1);
  });

  it("passes exactly at the cut: round(100 + pct*900) === 720 counts as pass", () => {
    // 31/45 = 0.6888… → scaled rounds to exactly 720, the real exam's passing standard.
    const form = QUESTIONS.slice(0, 45);
    const wrongOpt = (i: number) => (i === 0 ? 1 : 0);
    const answers = Object.fromEntries(
      form.map((q, i) =>
        i < 31
          ? [q.id, q.correct]
          : [q.id, [wrongOpt(q.correct[0])]],
      ),
    );
    const r = computeResults(form.map((q) => q.id), answers);
    expect(r.correct).toBe(31);
    expect(r.scaled).toBe(720);
    expect(r.pass).toBe(true);
  });

  it("breaks the score down per domain, zero-filling domains absent from the form", () => {
    const d1 = firstOfDomain("D1");
    const d3 = firstOfDomain("D3");
    const r = computeResults([d1.id, d3.id], {
      [d1.id]: d1.correct,
      [d3.id]: [d3.correct[0] === 0 ? 1 : 0],
    });
    expect(r.byDomain.D1).toEqual({ total: 1, correct: 1, pct: 1 });
    expect(r.byDomain.D3).toEqual({ total: 1, correct: 0, pct: 0 });
    expect(r.byDomain.D2).toEqual({ total: 0, correct: 0, pct: 0 });
  });
});
