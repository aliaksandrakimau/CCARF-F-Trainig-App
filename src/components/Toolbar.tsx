import { playCue } from "../lib/audio";
import type { View, CueName } from "../types";
import styles from "../styles/toolbar.module.css";

interface ToolbarProps {
  view: View;
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
  sound,
  theme,
  submitted,
  setView,
  setSound,
  setTheme,
  resetAll,
}: ToolbarProps) {
  return (
    <div className={styles.toolbar}>
      {(
        [
          ["practice", "Practice"],
          ["exam", "Exam simulation"],
        ] as const
      ).map(([v, lbl]) => {
        const active = view === v || (v === "exam" && view === "results");
        return (
          <button
            key={v}
            onClick={() =>
              setView(
                v === "practice"
                  ? "practice"
                  : submitted
                    ? "results"
                    : "exam",
              )
            }
            className={active ? styles.viewBtnActive : styles.viewBtn}
          >
            {lbl}
          </button>
        );
      })}
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
