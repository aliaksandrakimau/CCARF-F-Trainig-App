import { playCue } from "../lib/audio";
import { navigate } from "../lib/router";
import type { View, CueName } from "../types";
import styles from "../styles/toolbar.module.css";

interface ToolbarProps {
  view: View;
  /** Current router path — "/" (trainer) or "/review-errors". */
  path: string;
  mistakesCount: number;
  sound: boolean;
  theme: string;
  submitted: boolean;
  setView: (v: View) => void;
  setSound: (v: boolean) => void;
  setTheme: (fn: (t: string) => string) => void;
  resetAll: () => void;
}

export function Toolbar({
  view,
  path,
  mistakesCount,
  sound,
  theme,
  submitted,
  setView,
  setSound,
  setTheme,
  resetAll,
}: ToolbarProps) {
  const onReview = path === "/review-errors";
  return (
    <div className={styles.toolbar}>
      {/* Two tabs: Practice (always available) and Exam (shows results after submission). */}
      {(
        [
          ["practice", "Practice"],
          ["exam", "Exam simulation"],
        ] as const
      ).map(([v, lbl]) => {
        // "Exam" tab stays highlighted while viewing results so the user sees
        // which mode produced the score report.
        const active = !onReview && (view === v || (v === "exam" && view === "results"));
        return (
          <button
            key={v}
            onClick={() => {
              // Returning from the error review page restores the trainer
              // exactly where it was — the trainer state never unmounts.
              if (onReview) navigate("/");
              setView(v === "practice" ? "practice" : submitted ? "results" : "exam");
            }}
            className={active ? styles.viewBtnActive : styles.viewBtn}
          >
            {lbl}
          </button>
        );
      })}
      <button
        onClick={() => navigate("/review-errors")}
        title="Questions you answered wrong, tracked locally in your browser"
        className={onReview ? styles.viewBtnActive : styles.viewBtn}
      >
        Review errors{mistakesCount > 0 ? ` · ${mistakesCount}` : ""}
      </button>
      <div style={{ flex: 1 }} />
      <button
        onClick={() => {
          const on = !sound;
          setSound(on);
          if (on) playCue("correct" as CueName);
        }}
        title={
          sound
            ? "Mute answer feedback sounds"
            : "Play a sound on each checked answer"
        }
        className={sound ? styles.iconBtnActive : styles.iconBtn}
      >
        {sound ? "♪ Sound" : "♪̸ Muted"}
      </button>
      <button
        onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        title={
          theme === "dark"
            ? "Switch to light theme"
            : "Switch to dark theme"
        }
        className={styles.iconBtn}
      >
        {theme === "dark" ? "☀ Light" : "☾ Dark"}
      </button>
      <button onClick={resetAll} className={styles.iconBtn}>
        Reset
      </button>
    </div>
  );
}
