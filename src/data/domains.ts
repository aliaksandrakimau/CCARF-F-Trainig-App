import type { DomainKey, DomainInfo } from "../types";
import { QUESTIONS } from "./questions";
import { shuffle } from "../lib/utils";

export const DOMAINS: Record<DomainKey, DomainInfo> = {
  D1: { label: "Agentic Architecture & Orchestration", weight: 27 },
  D2: { label: "Tool Design & MCP Integration", weight: 18 },
  D3: { label: "Claude Code Configuration & Workflows", weight: 20 },
  D4: { label: "Prompt Engineering & Structured Output", weight: 20 },
  D5: { label: "Context Management & Reliability", weight: 15 },
};

export const EXAM_SIZE = 60;
export const EXAM_MINUTES = 120;
export const EXAM_QUOTAS: Record<DomainKey, number> = {
  D1: 16,
  D2: 11,
  D3: 12,
  D4: 12,
  D5: 9,
};

// Build a 60-question exam form weighted to the official blueprint.
// Each domain contributes its quota of questions (summing to 60).
// If any domain has fewer questions than its quota, the shortfall is filled
// from a shuffled pool of remaining questions across all domains.
export const buildExamForm = (): number[] => {
  const picked: number[] = [];
  const spare: number[] = [];
  (Object.keys(DOMAINS) as DomainKey[]).forEach((d) => {
    const pool = shuffle(QUESTIONS.filter((q) => q.domain === d).map((q) => q.id));
    picked.push(...pool.slice(0, EXAM_QUOTAS[d]));
    spare.push(...pool.slice(EXAM_QUOTAS[d]));
  });
  if (picked.length < EXAM_SIZE)
    picked.push(...shuffle(spare).slice(0, EXAM_SIZE - picked.length));
  return shuffle(picked).slice(0, EXAM_SIZE);
};
