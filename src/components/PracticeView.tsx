import { QUESTIONS } from "../data/questions";
import { DOMAINS } from "../data/domains";
import { shuffle, fmtTime } from "../lib/utils";
import { playCue } from "../lib/audio";
import { QuestionCard } from "./QuestionCard";
import type { Answers, OptionState, Question } from "../types";
import styles from "../styles/practice.module.css";
import shared from "../styles/shared.module.css";

interface PracticeViewProps {
  answers: Answers;
  checked: Record<number, boolean>;
  filter: string;
  idx: number;
  list: number[];
  sound: boolean;
  drillMins: number;
  setDrillMins: (m: number) => void;
  drillLeft: number;
  drillRunning: boolean;
  drillDone: boolean;
  setDrillRunning: (v: boolean) => void;
  startDrill: () => void;
  stopDrill: () => void;
  restartDrill: () => void;
  setFilter: (f: string) => void;
  setOrder: (ids: number[]) => void;
  setIdx: (fn: (i: number) => number) => void;
  setChecked: (fn: (c: Record<number, boolean>) => Record<number, boolean>) => void;
  optState: (q: Question, optIdx: number) => OptionState;
  toggle: (qid: number, optIdx: number, isMulti: boolean) => void;
  isRight: (q: Question) => boolean;
}

export function PracticeView({
  answers,
  checked,
  filter,
  idx,
  list,
  sound,
  drillMins,
  setDrillMins,
  drillLeft,
  drillRunning,
  drillDone,
  setDrillRunning,
  startDrill,
  stopDrill,
  restartDrill,
  setFilter,
  setOrder,
  setIdx,
  setChecked,
  optState,
  toggle,
  isRight,
}: PracticeViewProps) {
  const curId = list[Math.min(idx, list.length - 1)];
  const cur = QUESTIONS.find((q) => q.id === curId);

  const answeredChecked = list.filter((id) => checked[id]);
  const correctCount = answeredChecked.filter((id) =>
    isRight(QUESTIONS.find((q) => q.id === id)!),
  ).length;

  // Timer UI stays visible when running, paused (drillLeft > 0), or finished (drillDone).
  const isTimerActive = drillRunning || drillLeft > 0 || drillDone;

  return (
    <>
      {/* filter + shuffle */}
      <div className={shared.flexRow}>
        <span className={shared.monoLabel}>Domain</span>
        {["ALL", ...Object.keys(DOMAINS)].map((d) => {
          const active = filter === d;
          return (
            <button
              key={d}
              onClick={() => setFilter(d)}
              title={d === "ALL" ? "All domains" : DOMAINS[d as keyof typeof DOMAINS]?.label}
              className={active ? styles.filterBtnActive : styles.filterBtn}
            >
              {d}
            </button>
          );
        })}
        <div className={shared.spacer} />
        <button
          onClick={() => {
            setOrder(shuffle(QUESTIONS.map((q) => q.id)));
            setIdx(() => 0);
          }}
          className={styles.shuffleBtn}
        >
          ⤮ Shuffle
        </button>
      </div>

      {/* practice timer */}
      <div className={shared.flexRow}>
        <span className={shared.monoLabel}>Timer</span>
        {[2, 5, 10, 20, 30, 60].map((m) => {
          const active = drillMins === m;
          return (
            <button
              key={m}
              onClick={() => setDrillMins(m)}
              disabled={drillRunning}
              title={
                drillRunning
                  ? "Stop the timer to change its length"
                  : m === 2
                    ? "2 minutes — the real exam's per-question pace"
                    : `${m}-minute drill`
              }
              className={`${active ? styles.timerBtnActive : styles.timerBtn} ${drillRunning && !active ? styles.timerBtnDisabled : ""}`}
            >
              {m}m
            </button>
          );
        })}

        {isTimerActive && (
          <span className={drillDone || drillLeft < 60 ? styles.timerDisplayWarning : styles.timerDisplay}>
            ⏱ {drillDone ? "Time's up" : fmtTime(drillLeft)}
          </span>
        )}

        <div className={shared.spacer} />

        {drillRunning && (
          <button onClick={() => setDrillRunning(false)} className={styles.pauseBtn}>
            ⏸ Pause
          </button>
        )}
        {!drillRunning && drillLeft > 0 && !drillDone && (
          <button onClick={() => setDrillRunning(true)} className={styles.resumeBtn}>
            ▶ Resume
          </button>
        )}
        <button
          onClick={isTimerActive ? stopDrill : startDrill}
          className={isTimerActive ? styles.stopBtn : styles.startBtn}
        >
          {isTimerActive ? "■ Stop" : `▶ Start ${drillMins}m`}
        </button>
      </div>

      {/* progress bar */}
      <div className={shared.flexRow}>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${((idx + 1) / list.length) * 100}%` }}
          />
        </div>
        <span className={styles.progressCounter}>
          {String(idx + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")}
        </span>
        <span className={styles.scoreCounter}>
          {correctCount}/{answeredChecked.length || 0} ✓
        </span>
      </div>

      {cur && (
        <QuestionCard
          q={cur}
          num={idx + 1}
          answers={answers}
          optState={optState}
          toggle={toggle}
          reveal={!!checked[cur.id]}
          isRight={isRight(cur)}
        />
      )}

      {/* actions */}
      <div className={shared.actionsRow}>
        <button
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          className={idx === 0 ? shared.btnNavDisabled : shared.btnNav}
        >
          ← Previous
        </button>

        {!checked[cur?.id ?? 0] ? (
          <button
            onClick={() => {
              if (!cur) return;
              setChecked((c) => ({ ...c, [cur.id]: true }));
              // Pause the timer when the user checks an answer so they can review
              // without the countdown ticking. It resumes on the next question.
              if (drillRunning) stopDrill();
              if (sound) playCue(isRight(cur) ? "correct" : "wrong");
            }}
            disabled={!(answers[cur?.id ?? 0] || []).length}
            className={!(answers[cur?.id ?? 0] || []).length ? shared.btnPrimaryDisabled : shared.btnPrimary}
          >
            Check answer
          </button>
        ) : (
          <button
            onClick={() => {
              setIdx((i) => Math.min(list.length - 1, i + 1));
              // Restart the drill so each question gets the full timer duration
              // instead of the remaining time from the previous question.
              if (drillRunning) restartDrill();
            }}
            disabled={idx >= list.length - 1}
            className={idx >= list.length - 1 ? shared.btnPrimaryDisabled : shared.btnPrimary}
          >
            Next question →
          </button>
        )}
        <div className={shared.spacer} />
        <button
          onClick={() => {
            setIdx((i) => Math.min(list.length - 1, i + 1));
            // Same restart behavior as "Next question" — consistent per-question pacing.
            if (drillRunning) restartDrill();
          }}
          disabled={idx >= list.length - 1}
          className={idx >= list.length - 1 ? shared.btnNavDisabled : shared.btnNav}
        >
          Skip →
        </button>
      </div>
    </>
  );
}
