import { useEffect, useState } from "react";

import { QUESTIONS } from "../data/questions";
import { arrEq } from "../lib/utils";
import {
  getMistakes,
  removeMistake,
  clearMistakes,
  subscribeMistakes,
} from "../lib/mistakeStore";
import { QuestionCard } from "./QuestionCard";
import type {
  Answers,
  MistakeRecord,
  OptionState,
  Question,
} from "../types";
import styles from "../styles/review.module.css";

// Reveal every option state (correct / incorrect / missed) — the review page
// is always in "checked" mode.
const reviewOptState =
  (answers: Answers) =>
  (q: Question, i: number): OptionState => {
    const sel = (answers[q.id] || []).includes(i);
    const isCorrect = q.correct.includes(i);
    if (isCorrect && sel) return "correct";
    if (isCorrect && !sel) return "missed";
    if (!isCorrect && sel) return "incorrect";
    return "idle";
  };

const fmtDate = (ts: number): string =>
  new Date(ts).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export function ReviewErrorsView() {
  const [records, setRecords] = useState<MistakeRecord[] | null>(null);

  const load = () => {
    void getMistakes().then(setRecords);
  };

  // Initial load plus a refresh after every store mutation anywhere in the app.
  useEffect(() => {
    load();
    return subscribeMistakes(load);
  }, []);

  // Records whose question id no longer exists in the bank (e.g. after the
  // bank was updated). They stay deletable via "Clear all" but aren't shown.
  const known = (records || []).filter((r) =>
    QUESTIONS.some((q) => q.id === r.qid),
  );
  const staleCount = (records || []).length - known.length;
  const unresolved = known.filter((r) => !r.resolved).length;

  const handleClearAll = () => {
    if (!records?.length) return;
    if (
      window.confirm("Delete all tracked mistakes? This cannot be undone.")
    ) {
      void clearMistakes();
    }
  };

  return (
    <>
      <div className={styles.headRow}>
        <h2 className={styles.heading}>Error review</h2>
        <span className={styles.subMeta}>
          {records === null
            ? "loading…"
            : `${known.length} question${known.length === 1 ? "" : "s"} · ${unresolved} still unresolved`}
        </span>
        <span style={{ flex: 1 }} />
        <button
          onClick={handleClearAll}
          disabled={!records?.length}
          className={styles.dangerBtn}
        >
          Clear all
        </button>
      </div>

      {records !== null && known.length === 0 && (
        <div className={styles.emptyState}>
          No mistakes tracked yet.
          <br />
          Answer a question incorrectly in practice or exam mode and it will
          show up here automatically.
        </div>
      )}

      {known.map((r, i) => {
        const q = QUESTIONS.find((x) => x.id === r.qid)!;
        const answers: Answers = { [r.qid]: r.selected };
        return (
          <div key={r.qid} className={styles.itemWrap}>
            <div className={styles.metaRow}>
              <span className={styles.countBadge}>
                ×{r.count} miss{r.count === 1 ? "" : "es"}
              </span>
              <span className={styles.modeTag}>{r.mode}</span>
              <span className={styles.dateText}>
                first {fmtDate(r.firstMissedAt)} · last{" "}
                {fmtDate(r.lastMissedAt)}
              </span>
              {r.resolved ? (
                <span className={styles.resolvedBadge}>solved ✓</span>
              ) : (
                <span className={styles.unresolvedBadge}>still shaky</span>
              )}
              <span style={{ flex: 1 }} />
              <button
                onClick={() => void removeMistake(r.qid)}
                title="Remove this mistake from the list"
                className={styles.removeBtn}
              >
                Remove ✕
              </button>
            </div>
            <QuestionCard
              q={q}
              num={i + 1}
              answers={answers}
              optState={reviewOptState(answers)}
              toggle={() => {}}
              reveal
              readOnly
              isRight={arrEq(r.selected, q.correct)}
            />
          </div>
        );
      })}

      {staleCount > 0 && (
        <div className={styles.emptyState}>
          {staleCount} tracked question{staleCount === 1 ? " is" : "s are"} no
          longer in the question bank and hidden here — use “Clear all” to
          remove stale entries.
        </div>
      )}
    </>
  );
}
