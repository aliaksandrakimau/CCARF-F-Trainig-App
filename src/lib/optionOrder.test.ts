import { describe, expect, it } from "vitest";
import { OPTION_PERMS } from "./optionOrder";
import { QUESTIONS } from "../data/questions";

// A broken permutation (missing question, duplicate or dropped index) would
// render a wrong option set or silently mislabel letters.
describe("option permutations", () => {
  it("covers every question with a bijection over its option indices", () => {
    for (const q of QUESTIONS) {
      const perm = OPTION_PERMS[q.id];
      expect(perm, `q${q.id}: no permutation`).toBeDefined();
      expect(perm, `q${q.id}: wrong length`).toHaveLength(q.options.length);
      expect([...perm].sort((a, b) => a - b), `q${q.id}: not a bijection`).toEqual(
        q.options.map((_, i) => i),
      );
    }
  });
});
