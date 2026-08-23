import type { OptionState } from "../types";
import styles from "../styles/option.module.css";

interface OptionProps {
  label: string;
  text: string;
  state: OptionState;
  onClick: () => void;
  isMulti: boolean;
  disabled: boolean;
}

const stateToOptionClass: Record<OptionState, string> = {
  idle: styles.optionIdle,
  selected: styles.optionSelected,
  correct: styles.optionCorrect,
  incorrect: styles.optionIncorrect,
  missed: styles.optionMissed,
};

const stateToMarkerClass: Record<OptionState, string> = {
  idle: styles.markerIdle,
  selected: styles.markerSelected,
  correct: styles.markerCorrect,
  incorrect: styles.markerIncorrect,
  missed: styles.markerMissed,
};

const markerContent: Record<OptionState, string> = {
  idle: "",
  selected: "",
  correct: "✓",
  incorrect: "✕",
  missed: "✓",
};

export function Option({ label, text, state, onClick, isMulti, disabled }: OptionProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${disabled ? styles.optionDisabled : styles.option} ${stateToOptionClass[state]}`}
    >
      <span
        className={`${isMulti ? styles.markerMulti : styles.marker} ${stateToMarkerClass[state]}`}
      >
        {markerContent[state] || label}
      </span>
      <span className={styles.text}>{text}</span>
    </button>
  );
}
