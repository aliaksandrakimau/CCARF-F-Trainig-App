import { useState, useEffect, useRef } from "react";
import { EXAM_MINUTES } from "../data/domains.js";

export function useExamTimer(doSubmit) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (examStarted) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            doSubmit();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [examStarted]);

  const startTimer = () => {
    setTimeLeft(EXAM_MINUTES * 60);
    setExamStarted(true);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setExamStarted(false);
  };

  return {
    timeLeft,
    examStarted,
    setExamStarted,
    startTimer,
    stopTimer,
  };
}
