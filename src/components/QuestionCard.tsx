import { LETTERS } from "../lib/utils";
import { DomainChip } from "./DomainChip";
import { TypePill } from "./TypePill";
import { Option } from "./Option";
import type { Question, Answers, OptionState } from "../types";
import styles from "../styles/question-card.module.css";

interface QuestionCardProps {
  q: Question;
  num: number;
  answers: Answers;
  optState: (q: Question, optIdx: number) => OptionState;
  toggle: (qid: number, optIdx: number, isMulti: boolean) => void;
  reveal: boolean;
  isRight: boolean;
  readOnly?: boolean;
}

export function QuestionCard({
  q,
  num,
  answers,
  optState,
  toggle,
  reveal,
  isRight,
  readOnly,
}: QuestionCardProps) {
  const isMulti = q.type === "multi";
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.qNumber}>
          Q{String(num).padStart(2, "0")}
        </span>
        <DomainChip code={q.domain} small />
        <TypePill type={q.type} />
        {reveal && (
          <span className={isRight ? styles.resultCorrect : styles.resultIncorrect}>
            {isRight ? "Correct ✓" : "Incorrect ✕"}
          </span>
        )}
      </div>

      <p className={styles.questionText}>{q.q}</p>

      {q.options.map((opt, i) => (
        <Option
          key={i}
          label={LETTERS[i]}
          text={opt}
          isMulti={isMulti}
          state={optState(q, i)}
          disabled={readOnly || reveal}
          onClick={() => toggle(q.id, i, isMulti)}
        />
      ))}

      {reveal && (
        <div className={styles.explanation}>
          <div className={styles.explanationLabel}>
            Why — {q.correct.map((c) => LETTERS[c]).join(", ")}
          </div>
          <p className={styles.explanationText}>{q.exp}</p>
        </div>
      )}
    </div>
  );
}
