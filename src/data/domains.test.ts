import { describe, expect, it } from "vitest";
import { DOMAINS, buildExamForm, EXAM_MINUTES, EXAM_QUOTAS, EXAM_SIZE } from "./domains";
import { QUESTIONS } from "./questions";

describe("blueprint constants", () => {
  it("quotas add up to the form size", () => {
    expect(Object.values(EXAM_QUOTAS).reduce((a, b) => a + b, 0)).toBe(EXAM_SIZE);
  });

  it("domain weights add up to 100%", () => {
    expect(Object.values(DOMAINS).reduce((a, d) => a + d.weight, 0)).toBe(100);
  });

  it("exam duration is positive", () => {
    expect(EXAM_MINUTES).toBeGreaterThan(0);
  });
});

describe("buildExamForm", () => {
  const byId = new Map(QUESTIONS.map((q) => [q.id, q]));

  it("produces a full form of unique, existing question ids", () => {
    for (let run = 0; run < 5; run++) {
      const form = buildExamForm();
      expect(form).toHaveLength(EXAM_SIZE);
      expect(new Set(form).size).toBe(EXAM_SIZE);
      for (const id of form) expect(byId.has(id), `unknown id ${id}`).toBe(true);
    }
  });

  it("respects the per-domain quotas (pools are large enough)", () => {
    const form = buildExamForm();
    const counts: Record<string, number> = {};
    for (const id of form) {
      const q = byId.get(id)!;
      counts[q.domain] = (counts[q.domain] || 0) + 1;
    }
    for (const d of Object.keys(EXAM_QUOTAS) as Array<keyof typeof EXAM_QUOTAS>) {
      expect(counts[d], `${d} count`).toBe(EXAM_QUOTAS[d]);
    }
  });
});
