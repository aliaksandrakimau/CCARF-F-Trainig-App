/* ============================================
   Domain definitions & exam configuration
   ============================================ */

export const DOMAINS = {
  D1: { label: "Agentic Architecture & Orchestration", weight: 27 },
  D2: { label: "Tool Design & MCP Integration", weight: 18 },
  D3: { label: "Claude Code Configuration & Workflows", weight: 20 },
  D4: { label: "Prompt Engineering & Structured Output", weight: 20 },
  D5: { label: "Context Management & Reliability", weight: 15 },
};

/* Real exam form: 60 items in 120 minutes, blueprint-weighted regardless of bank size. */
export const EXAM_SIZE = 60;
export const EXAM_MINUTES = 120;
export const EXAM_QUOTAS = { D1: 16, D2: 11, D3: 12, D4: 12, D5: 9 };

import { QUESTIONS } from "./questions.js";
import { shuffle } from "../lib/utils.js";

// Draws a fresh blueprint-weighted form from the full bank; each sitting differs.
export const buildExamForm = () => {
  const picked = [];
  const spare = [];
  Object.keys(DOMAINS).forEach((d) => {
    const pool = shuffle(QUESTIONS.filter((q) => q.domain === d).map((q) => q.id));
    picked.push(...pool.slice(0, EXAM_QUOTAS[d]));
    spare.push(...pool.slice(EXAM_QUOTAS[d]));
  });
  if (picked.length < EXAM_SIZE) picked.push(...shuffle(spare).slice(0, EXAM_SIZE - picked.length));
  return shuffle(picked).slice(0, EXAM_SIZE);
};
