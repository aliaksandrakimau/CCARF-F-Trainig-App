import { T } from "../lib/theme.js";
import { LETTERS } from "../lib/utils.js";
import { card } from "./styles.js";
import { DomainChip } from "./DomainChip.jsx";
import { TypePill } from "./TypePill.jsx";
import { Option } from "./Option.jsx";

export function QuestionCard({
  q,
  num,
  answers,
  optState,
  toggle,
  reveal,
  isRight,
  readOnly,
}) {
  const isMulti = q.type === "multi";
  return (
    <div style={card()}>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontFamily: T.mono,
            fontSize: 13,
            fontWeight: 800,
            color: T.ink,
          }}
        >
          Q{String(num).padStart(2, "0")}
        </span>
        <DomainChip code={q.domain} small />
        <TypePill type={q.type} />
        {reveal && (
          <span
            style={{
              marginLeft: "auto",
              fontFamily: T.mono,
              fontSize: 12,
              fontWeight: 700,
              color: isRight ? T.good : T.bad,
            }}
          >
            {isRight ? "Correct ✓" : "Incorrect ✕"}
          </span>
        )}
      </div>

      <p
        style={{
          fontSize: 15.5,
          lineHeight: 1.55,
          margin: "0 0 16px",
          color: T.ink,
          fontWeight: 500,
        }}
      >
        {q.q}
      </p>

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
        <div
          style={{
            marginTop: 14,
            padding: "13px 15px",
            borderRadius: 10,
            background: T.expBg,
            border: `1px solid ${T.line}`,
          }}
        >
          <div
            style={{
              fontFamily: T.mono,
              fontSize: 10.5,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: T.accent,
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            Why — {q.correct.map((c) => LETTERS[c]).join(", ")}
          </div>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: T.muted }}>
            {q.exp}
          </p>
        </div>
      )}
    </div>
  );
}
