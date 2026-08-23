import { QUESTIONS } from "../data/questions";
import { DOMAINS } from "../data/domains";
import { QuestionCard } from "./QuestionCard";
import type { Answers, ExamResults, OptionState, Question } from "../types";
import styles from "../styles/results.module.css";
import shared from "../styles/shared.module.css";

interface ResultsViewProps {
  results: ExamResults;
  examIds: number[];
  examAnswers: Answers;
  onRetake: () => void;
  onBackToPractice: () => void;
  optState: (q: Question, optIdx: number) => OptionState;
  isRight: (q: Question) => boolean;
}

export function ResultsView({
  results,
  examIds,
  examAnswers,
  onRetake,
  onBackToPractice,
  optState,
  isRight,
}: ResultsViewProps) {
  return (
    <>
      <div
        className={`${styles.scoreCard} ${results.pass ? styles.scoreCardPass : styles.scoreCardFail}`}
      >
        <div className={styles.scoreLabel}>Approximate scaled score</div>
        <div
          className={`${styles.scoreValue} ${results.pass ? styles.scoreValuePass : styles.scoreValueFail}`}
        >
          {results.scaled}
        </div>
        <div className={styles.scoreStats}>
          {results.correct} / {results.total} correct ·{" "}
          {Math.round(results.pct * 100)}%
        </div>
        <div
          className={`${styles.badge} ${results.pass ? styles.badgePass : styles.badgeFail}`}
        >
          {results.pass ? "PASS (≥ 720)" : "BELOW CUT (720)"}
        </div>
        <div className={styles.disclaimer}>
          Practice estimate only — the real exam uses scaled scoring across 60
          items.
        </div>
      </div>

      {/* domain breakdown */}
      <div className={styles.domainCard}>
        <h3 className={styles.domainHeading}>Performance by domain</h3>
        {(Object.keys(DOMAINS) as Array<keyof typeof DOMAINS>).map((d) => {
          const r = results.byDomain[d];
          const p = Math.round(r.pct * 100);
          const barClass =
            p >= 70 ? styles.barFillGood : p >= 50 ? styles.barFillAmber : styles.barFillBad;
          return (
            <div key={d} className={styles.domainRow}>
              <div className={styles.domainLabelRow}>
                <span className={styles.domainLabel}>
                  <span className={styles.domainCode}>{d}</span>{" "}
                  {DOMAINS[d].label}{" "}
                  <span className={styles.domainWeight}>
                    · {DOMAINS[d].weight}% of exam
                  </span>
                </span>
                <span className={styles.domainStats}>
                  {r.correct}/{r.total} · {p}%
                </span>
              </div>
              <div className={styles.barTrack}>
                <div
                  className={barClass}
                  style={{ width: `${p}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* review */}
      <h3 className={styles.reviewHeading}>Answer review</h3>
      {examIds.map((id, i) => {
        const q = QUESTIONS.find((x) => x.id === id);
        if (!q) return null;
        return (
          <QuestionCard
            key={id}
            q={q}
            num={i + 1}
            answers={examAnswers}
            optState={optState}
            toggle={() => {}}
            reveal
            isRight={isRight(q)}
            readOnly
          />
        );
      })}

      <div className={shared.actionsRow}>
        <button onClick={onRetake} className={shared.btnPrimary}>
          Retake exam
        </button>
        <button onClick={onBackToPractice} className={shared.btnNav}>
          Back to practice
        </button>
      </div>
    </>
  );
}
