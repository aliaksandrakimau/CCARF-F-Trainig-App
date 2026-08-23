import { T } from "../lib/theme.js";

export function Option({ label, text, state, onClick, isMulti, disabled }) {
  // state: "idle" | "selected" | "correct" | "incorrect" | "missed"
  const styles = {
    idle: { border: T.line, bg: T.surface, mark: T.faint, markBg: "transparent" },
    selected: {
      border: T.accentLine,
      bg: T.accentSoft,
      mark: T.accent,
      markBg: T.accentSoft,
    },
    correct: {
      border: T.goodLine,
      bg: T.goodSoft,
      mark: T.good,
      markBg: T.goodSoft,
    },
    incorrect: {
      border: T.badLine,
      bg: T.badSoft,
      mark: T.bad,
      markBg: T.badSoft,
    },
    missed: {
      border: T.goodLine,
      bg: T.missedSoft,
      mark: T.good,
      markBg: "transparent",
    },
  }[state];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        width: "100%",
        textAlign: "left",
        padding: "12px 14px",
        borderRadius: 10,
        border: `1.5px solid ${styles.border}`,
        background: styles.bg,
        cursor: disabled ? "default" : "pointer",
        transition: "border-color .12s, background .12s",
        marginBottom: 8,
      }}
    >
      <span
        style={{
          flex: "0 0 auto",
          width: 24,
          height: 24,
          borderRadius: isMulti ? 6 : "50%",
          border: `1.5px solid ${styles.mark}`,
          background: styles.markBg,
          color: styles.mark,
          display: "grid",
          placeItems: "center",
          fontFamily: T.mono,
          fontSize: 12,
          fontWeight: 700,
          marginTop: 1,
        }}
      >
        {state === "correct" || state === "missed"
          ? "✓"
          : state === "incorrect"
            ? "✕"
            : label}
      </span>
      <span style={{ color: T.ink, fontSize: 14.5, lineHeight: 1.5 }}>
        {text}
      </span>
    </button>
  );
}
