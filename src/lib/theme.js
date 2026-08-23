/* ============================================
   Design tokens & CSS custom-property themes
   ============================================ */

export const T = {
  bg: "var(--bg)",
  grid: "var(--grid)",
  surface: "var(--surface)",
  ink: "var(--ink)",
  muted: "var(--muted)",
  faint: "var(--faint)",
  line: "var(--line)",
  accent: "var(--accent)",
  accentSoft: "var(--accent-soft)",
  accentLine: "var(--accent-line)",
  amber: "var(--amber)",
  amberSoft: "var(--amber-soft)",
  amberLine: "var(--amber-line)",
  good: "var(--good)",
  goodSoft: "var(--good-soft)",
  goodLine: "var(--good-line)",
  bad: "var(--bad)",
  badSoft: "var(--bad-soft)",
  badLine: "var(--bad-line)",
  missedSoft: "var(--missed-soft)",
  expBg: "var(--exp-bg)",
  btnDisabled: "var(--btn-disabled)",
  onAccent: "var(--on-accent)",
  mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  sans: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
};

export const THEME_CSS = `
[data-theme="light"] {
  --bg: #EEF1F6; --grid: rgba(41,75,181,0.05); --surface: #FFFFFF;
  --ink: #16202E; --muted: #5B6B80; --faint: #8A99AD; --line: #D7DEEA;
  --accent: #294BB5; --accent-soft: #E8EDFB; --accent-line: #B9C6EE;
  --amber: #B26A00; --amber-soft: #FBEFD9; --amber-line: #EAD3A3;
  --good: #1F8A5B; --good-soft: #E4F4EC; --good-line: #A7DBC2;
  --bad: #C0392B; --bad-soft: #FBEAE7; --bad-line: #EBB8B0;
  --missed-soft: #F1FAF5; --exp-bg: #F6F8FC; --btn-disabled: #A9B6D8;
  --on-accent: #FFFFFF;
}
[data-theme="dark"] {
  --bg: #0F1522; --grid: rgba(122,150,232,0.06); --surface: #172034;
  --ink: #E8EDF7; --muted: #9AA8BF; --faint: #66748C; --line: #2A3752;
  --accent: #7A96E8; --accent-soft: #212F52; --accent-line: #3D5288;
  --amber: #E0A94F; --amber-soft: #33290F; --amber-line: #5C4A26;
  --good: #4CC38A; --good-soft: #14301F; --good-line: #2C5E45;
  --bad: #E8756A; --bad-soft: #381D1A; --bad-line: #6B3430;
  --missed-soft: #102618; --exp-bg: #131C2E; --btn-disabled: #3A4A6B;
  --on-accent: #0F1522;
}
[data-theme] { color-scheme: light; }
[data-theme="dark"] { color-scheme: dark; }
`;
