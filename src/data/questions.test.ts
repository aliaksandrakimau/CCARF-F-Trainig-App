import { describe, expect, it } from "vitest";
import { QUESTIONS } from "./questions";
import { DOMAINS, EXAM_QUOTAS } from "./domains";

// The bank is hand-written static data — a typo here (an out-of-range correct
// index, a duplicate id) would silently break rendering or scoring.
describe("question bank integrity", () => {
  it("has unique ids", () => {
    const ids = QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every question is well-formed", () => {
    for (const q of QUESTIONS) {
      expect(q.options.length, `q${q.id}: needs at least 2 options`).toBeGreaterThanOrEqual(2);
      expect(q.q.trim(), `q${q.id}: empty prompt`).not.toBe("");
      expect(q.exp.trim(), `q${q.id}: empty explanation`).not.toBe("");

      expect(
        q.correct.length,
        `q${q.id}: at least one correct option`,
      ).toBeGreaterThanOrEqual(1);
      for (const c of q.correct) {
        expect(c, `q${q.id}: correct index ${c} out of range`).toBeLessThan(q.options.length);
        expect(c).toBeGreaterThanOrEqual(0);
      }
      expect(new Set(q.correct).size, `q${q.id}: duplicate correct indices`).toBe(q.correct.length);
    }
  });

  it("single-answer questions have exactly one correct option", () => {
    for (const q of QUESTIONS.filter((q) => q.type === "single")) {
      expect(q.correct.length, `q${q.id}`).toBe(1);
    }
  });

  it("every domain is one of the blueprint domains", () => {
    for (const q of QUESTIONS) {
      expect(DOMAINS[q.domain], `q${q.id}: unknown domain ${q.domain}`).toBeDefined();
    }
  });
});

describe("bank coverage vs exam quotas", () => {
  it("every domain has enough questions to fill its quota", () => {
    for (const d of Object.keys(DOMAINS) as Array<keyof typeof DOMAINS>) {
      const pool = QUESTIONS.filter((q) => q.domain === d).length;
      expect(pool, `${d}: ${pool} questions < quota ${EXAM_QUOTAS[d]}`).toBeGreaterThanOrEqual(EXAM_QUOTAS[d]);
    }
  });
});

// Test-wise distractors must be plausible: if the correct option is far longer
// than the wrong ones, the question is guessable by length alone. Literal-style
// questions (short API constants where every option is similar in size) are
// exempt — there the ratio is meaningless.
describe("distractor length balance", () => {
  const MIN_RATIO = 0.7;
  const MAX_RATIO = 1.3;
  const LITERAL_MAX_SPREAD = 45;

  it("the correct option stays within ±30% of the average distractor length", () => {
    for (const q of QUESTIONS) {
      if (q.type === "multi") continue;
      const lens = q.options.map((o) => o.length);
      if (Math.max(...lens) - Math.min(...lens) <= LITERAL_MAX_SPREAD) continue;
      const correctLen = lens[q.correct[0]];
      const wrongLens = q.options
        .filter((_, i) => !q.correct.includes(i))
        .map((o) => o.length);
      const avgWrong =
        wrongLens.reduce((sum, n) => sum + n, 0) / wrongLens.length;
      const ratio = correctLen / avgWrong;
      expect(
        ratio,
        `q${q.id}: correct option is ${ratio.toFixed(2)}× the average distractor length (${correctLen} vs ~${Math.round(avgWrong)} chars)`,
      ).toBeGreaterThanOrEqual(MIN_RATIO);
      expect(
        ratio,
        `q${q.id}: correct option is ${ratio.toFixed(2)}× the average distractor length (${correctLen} vs ~${Math.round(avgWrong)} chars)`,
      ).toBeLessThanOrEqual(MAX_RATIO);
    }
  });
});
