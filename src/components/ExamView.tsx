import { QUESTIONS } from "../data/questions";
import { fmtTime } from "../lib/utils";
import { QuestionCard } from "./QuestionCard";
import type { Answers, OptionState, Question } from "../types";
import styles from "../styles/exam.module.css";
import shared from "../styles/shared.module.css";

interface ExamViewProps {
  timeLeft: number;
  examIds: number[];
  examAnswers: Answers;
  idx: number;
  onSubmit: () => void;
  setIdx: (fn: (i: number) => number) => void;
  optState: (q: Question, optIdx: number) => OptionState;
  toggle: (qid: number, optIdx: number, isMulti: boolean) => void;
}

export function ExamView({
  timeLeft,
  examIds,
  examAnswers,
  idx,
  onSubmit,
  setIdx,
  optState,
  toggle,
}: ExamViewProps) {
  const list = examIds;
  const curId = list[Math.min(idx, list.length - 1)];
  const cur = QUESTIONS.find((q) => q.id === curId);

  return (
    <>
      <div className={shared.flexRow}>
        {/* Turn red when less than 2 minutes remain. */}
        <div className={timeLeft < 120 ? styles.timerDisplayWarning : styles.timerDisplay}>
          ⏱ {fmtTime(timeLeft)}
        </div>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${((idx + 1) / list.length) * 100}%` }}
          />
        </div>
        <span className={styles.stats}>
          {idx + 1}/{list.length} · answered {Object.keys(examAnswers).length}
        </span>
      </div>

      {cur && (
        <QuestionCard
          q={cur}
          num={idx + 1}
          answers={examAnswers}
          optState={optState}
          toggle={toggle}
          reveal={false}
        />
      )}

      {/* jump grid */}
      <div className={styles.jumpGrid}>
        {list.map((id, i) => {
          const done = (examAnswers[id] || []).length > 0;
          const here = i === idx;
          return (
            <button
              key={id}
              onClick={() => setIdx(() => i)}
              className={here ? styles.jumpBtnActive : done ? styles.jumpBtnDone : styles.jumpBtn}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <div className={shared.flexRowTight}>
        <button
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          className={idx === 0 ? shared.btnNavDisabled : shared.btnNav}
        >
          ← Previous
        </button>
        <button
          onClick={() => setIdx((i) => Math.min(list.length - 1, i + 1))}
          disabled={idx >= list.length - 1}
          className={idx >= list.length - 1 ? shared.btnNavDisabled : shared.btnNav}
        >
          Next →
        </button>
        <div className={shared.spacer} />
        <button onClick={onSubmit} className={styles.submitBtn}>
          Submit exam
        </button>
      </div>
    </>
  );
}
