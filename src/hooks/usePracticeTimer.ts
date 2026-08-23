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
}

export function usePracticeTimer(sound: boolean): PracticeTimerReturn {
  const [drillMins, setDrillMins] = useState(20);
  const [drillLeft, setDrillLeft] = useState(0);
  const [drillRunning, setDrillRunning] = useState(false);
  const [drillDone, setDrillDone] = useState(false);

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

  return {
    drillMins,
    setDrillMins,
    drillLeft,
    drillRunning,
    drillDone,
    startDrill,
    stopDrill,
  };
}
