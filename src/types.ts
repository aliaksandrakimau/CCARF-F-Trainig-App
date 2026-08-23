export type DomainKey = "D1" | "D2" | "D3" | "D4" | "D5";

export type OptionState = "idle" | "selected" | "correct" | "incorrect" | "missed";

export type View = "practice" | "exam" | "results";

export type CueName = "correct" | "wrong" | "start" | "end";

export interface Question {
  id: number;
  domain: DomainKey;
  type: "single" | "multi";
  q: string;
  options: string[];
  /** Indices into `options` that are correct (e.g. [0, 2] for multi-answer). */
  correct: number[];
  /** Explanation shown after the user checks their answer. */
  exp: string;
}

export interface DomainInfo {
  label: string;
  weight: number;
}

export interface DomainResult {
  total: number;
  correct: number;
  pct: number;
}

export interface ExamResults {
  total: number;
  correct: number;
  pct: number;
  scaled: number;
  pass: boolean;
  byDomain: Record<DomainKey, DomainResult>;
}

export type Answers = Record<number, number[]>;
