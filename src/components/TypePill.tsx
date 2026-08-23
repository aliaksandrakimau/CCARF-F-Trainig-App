import styles from "../styles/type-pill.module.css";

interface TypePillProps {
  type: "single" | "multi";
}

export function TypePill({ type }: TypePillProps) {
  const multi = type === "multi";
  return (
    <span className={multi ? styles.pillMulti : styles.pill}>
      {multi ? "Select multiple" : "Single answer"}
    </span>
  );
}
