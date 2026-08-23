import { QUESTIONS } from "../data/questions";
import { DOMAINS, EXAM_SIZE, EXAM_MINUTES, EXAM_QUOTAS } from "../data/domains";
import styles from "../styles/exam-intro.module.css";
import shared from "../styles/shared.module.css";

interface ExamIntroProps {
  onStart: () => void;
}

export function ExamIntro({ onStart }: ExamIntroProps) {
  return (
    <div className={styles.card}>
      <h2 className={styles.heading}>Exam simulation</h2>
      <p className={styles.text}>
        A fresh {EXAM_SIZE}-question form is drawn from the{" "}
        {QUESTIONS.length}-item bank each time, weighted to the blueprint (
        {Object.keys(DOMAINS)
          .map((d) => `${d} ${EXAM_QUOTAS[d as keyof typeof EXAM_QUOTAS]}`)
          .join(" · ")}
        ) and shuffled. The clock runs {EXAM_MINUTES} minutes, exactly like the
        real exam. No feedback until you submit, then you get a full score
        report and answer review.
      </p>
      <ul className={styles.list}>
        <li>Passing standard on the real exam: scaled 720 / 1000.</li>
        <li>The scaled number here is an approximation for practice only.</li>
        <li>Practice-mode filters and shuffling never affect the exam form.</li>
      </ul>
      <button onClick={onStart} className={shared.btnPrimary}>
        Start exam
      </button>
    </div>
  );
}
