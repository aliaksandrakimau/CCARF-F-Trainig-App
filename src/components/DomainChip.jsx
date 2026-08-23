import { T } from "../lib/theme.js";
import { DOMAINS } from "../data/domains.js";

export function DomainChip({ code, small }) {
  return (
    <span
      style={{
        fontFamily: T.mono,
        fontSize: small ? 10 : 11,
        letterSpacing: "0.06em",
        color: T.accent,
        background: T.accentSoft,
        border: `1px solid ${T.accentLine}`,
        padding: small ? "2px 6px" : "3px 8px",
        borderRadius: 5,
        whiteSpace: "nowrap",
        textTransform: "uppercase",
        fontWeight: 600,
      }}
      title={DOMAINS[code].label}
    >
      {code} · {DOMAINS[code].label}
    </span>
  );
}
