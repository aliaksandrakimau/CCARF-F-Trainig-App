export const LETTERS: string[] = ["A", "B", "C", "D", "E"];

export const arrEq = (a: number[], b: number[]): boolean =>
  a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i]);

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
