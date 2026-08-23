import { T } from "../lib/theme.js";

export function TypePill({ type }) {
  const multi = type === "multi";
  return (
    <span
      style={{
        fontFamily: T.mono,
        fontSize: 10,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: multi ? T.amber : T.muted,
        background: multi ? T.amberSoft : "transparent",
        border: `1px solid ${multi ? T.amberLine : T.line}`,
        padding: "2px 7px",
        borderRadius: 5,
        fontWeight: 600,
      }}
    >
      {multi ? "Select multiple" : "Single answer"}
    </span>
  );
}
