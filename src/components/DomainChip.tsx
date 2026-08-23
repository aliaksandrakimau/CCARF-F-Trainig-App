import { DOMAINS } from "../data/domains";
import type { DomainKey } from "../types";
import styles from "../styles/domain-chip.module.css";

interface DomainChipProps {
  code: DomainKey;
  small?: boolean;
}

export function DomainChip({ code, small }: DomainChipProps) {
  return (
    <span
      className={small ? styles.chipSmall : styles.chip}
      title={DOMAINS[code].label}
    >
      {code} · {DOMAINS[code].label}
    </span>
  );
}
