import { QUESTIONS } from "../data/questions";
import { shuffle } from "./utils";

export type OptionPerms = Record<number, number[]>;

/**
 * Per-question permutation of option indices (display position → original
 * index), regenerated on every app load. The bank's source order clusters
 * correct answers at position B, so rendering options in source order would
 * let users answer by letter instead of by content.
 */
export const OPTION_PERMS: OptionPerms = Object.fromEntries(
  QUESTIONS.map((q) => [q.id, shuffle(q.options.map((_, i) => i))]),
);
