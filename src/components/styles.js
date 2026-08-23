/* ============================================
   Shared style factories
   ============================================ */

import { T } from "../lib/theme.js";

export function card() {
  return {
    background: T.surface,
    border: `1.5px solid ${T.line}`,
    borderRadius: 14,
    padding: "18px 20px",
    marginBottom: 14,
    boxShadow: "0 1px 2px rgba(22,32,46,0.03)",
  };
}

export function primaryBtn(disabled) {
  return {
    fontFamily: T.sans,
    fontSize: 14,
    fontWeight: 700,
    padding: "10px 20px",
    borderRadius: 10,
    border: `1.5px solid ${T.accent}`,
    background: disabled ? T.btnDisabled : T.accent,
    borderColor: disabled ? T.btnDisabled : T.accent,
    color: T.onAccent,
    cursor: disabled ? "default" : "pointer",
  };
}

export function navBtn(disabled) {
  return {
    fontFamily: T.sans,
    fontSize: 14,
    fontWeight: 600,
    padding: "10px 18px",
    borderRadius: 10,
    border: `1.5px solid ${T.line}`,
    background: T.surface,
    color: disabled ? T.faint : T.ink,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.6 : 1,
  };
}
