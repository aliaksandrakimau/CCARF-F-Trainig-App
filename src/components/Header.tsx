import { QUESTIONS } from "../data/questions";
import { EXAM_SIZE, EXAM_MINUTES } from "../data/domains";
import styles from "../styles/header.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.examCode}>Exam Code · CCAR-F</div>
      <h1 className={styles.title}>
        Claude Certified Architect
        <span className={styles.subtitle}>
          Foundations — Practice Trainer
        </span>
      </h1>
      <p className={styles.description}>
        {QUESTIONS.length} scenario items across all five blueprint domains.
        Practice mode gives instant feedback and explanations; exam mode draws a
        fresh {EXAM_SIZE}-item form and runs the real {EXAM_MINUTES}-minute
        clock.
      </p>
    </header>
  );
}
