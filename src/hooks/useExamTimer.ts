import { useState, useEffect, useRef } from "react";
import { EXAM_MINUTES } from "../data/domains";

interface ExamTimerReturn {
  timeLeft: number;
  examStarted: boolean;
  setExamStarted: (v: boolean) => void;
  startTimer: () => void;
  stopTimer: () => void;
}

export function useExamTimer(doSubmit: () => void): ExamTimerReturn {
  const [timeLeft, setTimeLeft] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (examStarted) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            doSubmit();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
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
