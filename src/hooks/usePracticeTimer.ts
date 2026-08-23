import { useState, useEffect } from "react";
import { fmtTime } from "../lib/utils";
import { playCue } from "../lib/audio";
import type { CueName } from "../types";

interface PracticeTimerReturn {
  drillMins: number;
  setDrillMins: (m: number) => void;
  drillLeft: number;
  drillRunning: boolean;
  drillDone: boolean;
  startDrill: () => void;
  stopDrill: () => void;
  /** Reset the countdown to the full duration and start again. */
  restartDrill: () => void;
}

export function usePracticeTimer(sound: boolean): PracticeTimerReturn {
  const [drillMins, setDrillMins] = useState(20);
  const [drillLeft, setDrillLeft] = useState(0);
  const [drillRunning, setDrillRunning] = useState(false);
  const [drillDone, setDrillDone] = useState(false);

  // The interval only exists while the drill is running. Setting drillRunning to false
  // triggers the cleanup, which clears the interval without any extra teardown logic.
  useEffect(() => {
    if (!drillRunning) return;
    const id = setInterval(() => setDrillLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [drillRunning]);

  useEffect(() => {
    if (drillRunning && drillLeft === 0) {
      setDrillRunning(false);
      setDrillDone(true);
      if (sound) playCue("end" as CueName);
    }
  }, [drillLeft, drillRunning, sound]);

  const startDrill = () => {
    setDrillLeft(drillMins * 60);
    setDrillDone(false);
    setDrillRunning(true);
    if (sound) playCue("start" as CueName);
  };

  const stopDrill = () => {
    setDrillRunning(false);
    setDrillLeft(0);
    setDrillDone(false);
  };

  // Reset the countdown to full duration without clearing state between stop/start.
  // The intermediate stop is needed so the interval effect tears down and re-creates
  // with the fresh timeLeft value.
  const restartDrill = () => {
    setDrillRunning(false);
    setDrillLeft(drillMins * 60);
    setDrillDone(false);
    setDrillRunning(true);
    if (sound) playCue("start" as CueName);
  };

  return {
    drillMins,
    setDrillMins,
    drillLeft,
    drillRunning,
    drillDone,
    startDrill,
    stopDrill,
    restartDrill,
  };
}
