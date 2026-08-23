export const LETTERS: string[] = ["A", "B", "C", "D", "E"];

// Order-independent array equality — used to compare selected options against
// correct answers, since the user's selection order doesn't matter.
export const arrEq = (a: number[], b: number[]): boolean =>
  a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i]);

// Fisher-Yates shuffle — returns a new array, never mutates the input.
export const shuffle = <T>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const fmtTime = (s: number): string =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
