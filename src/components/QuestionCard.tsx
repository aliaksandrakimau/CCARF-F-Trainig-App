import { LETTERS } from "../lib/utils";
import { OPTION_PERMS } from "../lib/optionOrder";
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
  // Options render in the session's shuffled order; every index passed to
  // optState/toggle below is an original bank index, so answers, scoring and
  // mistake tracking never see the permutation.
  const perm = OPTION_PERMS[q.id] ?? q.options.map((_, i) => i);
  // Options are disabled in readOnly mode (results review) or after the answer is revealed.
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

      {perm.map((orig, pos) => (
        <Option
          key={orig}
          label={LETTERS[pos]}
          text={q.options[orig]}
          isMulti={isMulti}
          state={optState(q, orig)}
          disabled={readOnly || reveal}
          onClick={() => toggle(q.id, orig, isMulti)}
        />
      ))}

      {reveal && (
        <div className={styles.explanation}>
          <div className={styles.explanationLabel}>
            Why — {q.correct.map((c) => LETTERS[perm.indexOf(c)]).join(", ")}
          </div>
          <p className={styles.explanationText}>{q.exp}</p>
        </div>
      )}
    </div>
  );
}
