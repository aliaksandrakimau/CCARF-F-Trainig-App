import type { Answers, DomainKey, ExamResults, Question } from "../types";
import { QUESTIONS } from "../data/questions";
import { DOMAINS } from "../data/domains";
import { arrEq } from "./utils";

/**
 * Score an exam form: raw correctness, a 100–1000 scaled score (720 = pass,
 * matching the real CCAR-F cut), and a per-domain breakdown. Unanswered
 * questions count as incorrect.
 */
export function computeResults(
  examIds: number[],
  examAnswers: Answers,
): ExamResults {
  const form = examIds
    .map((id) => QUESTIONS.find((q) => q.id === id))
    .filter(Boolean) as Question[];
  const total = form.length;
  const correct = form.filter((q) =>
    arrEq(examAnswers[q.id] || [], q.correct),
  ).length;
  const pct = total ? correct / total : 0;
  const scaled = Math.round(100 + pct * 900);
  const byDomain = {} as Record<
    DomainKey,
    { total: number; correct: number; pct: number }
  >;
  (Object.keys(DOMAINS) as DomainKey[]).forEach((d) => {
    const qs = form.filter((q) => q.domain === d);
    const c = qs.filter((q) => arrEq(examAnswers[q.id] || [], q.correct)).length;
    byDomain[d] = {
      total: qs.length,
      correct: c,
      pct: qs.length ? c / qs.length : 0,
    };
  });
  return { total, correct, pct, scaled, pass: scaled >= 720, byDomain };
}
