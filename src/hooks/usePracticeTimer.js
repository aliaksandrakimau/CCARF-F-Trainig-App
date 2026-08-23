import { useState, useEffect } from "react";
import { fmtTime } from "../lib/utils.js";
import { playCue } from "../lib/audio.js";

export function usePracticeTimer(sound) {
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
      if (sound) playCue("end");
    }
  }, [drillLeft, drillRunning, sound]);

  const startDrill = () => {
    setDrillLeft(drillMins * 60);
    setDrillDone(false);
    setDrillRunning(true);
    if (sound) playCue("start");
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
