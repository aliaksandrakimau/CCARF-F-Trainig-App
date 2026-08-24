import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { usePracticeTimer } from "./usePracticeTimer";
import { playCue } from "../lib/audio";

vi.mock("../lib/audio", () => ({ playCue: vi.fn() }));

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(playCue).mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("usePracticeTimer", () => {
  it("defaults to a 20-minute drill that is not running", () => {
    const { result } = renderHook(() => usePracticeTimer(false));
    expect(result.current.drillMins).toBe(20);
    expect(result.current.drillLeft).toBe(0);
    expect(result.current.drillRunning).toBe(false);
    expect(result.current.drillDone).toBe(false);
  });

  it("counts down the selected duration once per second", () => {
    const { result } = renderHook(() => usePracticeTimer(false));
    act(() => result.current.setDrillMins(5));
    act(() => result.current.startDrill());

    expect(result.current.drillLeft).toBe(300);
    expect(result.current.drillRunning).toBe(true);

    act(() => vi.advanceTimersByTime(10000));
    expect(result.current.drillLeft).toBe(290);
    expect(result.current.drillDone).toBe(false);
  });

  it("stops itself at zero, flags done, and plays the end cue when sound is on", () => {
    const { result } = renderHook(() => usePracticeTimer(true));
    act(() => result.current.setDrillMins(2));
    act(() => result.current.startDrill());
    expect(playCue).toHaveBeenCalledWith("start");

    act(() => vi.advanceTimersByTime(2 * 60 * 1000));

    expect(result.current.drillLeft).toBe(0);
    expect(result.current.drillRunning).toBe(false);
    expect(result.current.drillDone).toBe(true);
    expect(playCue).toHaveBeenCalledWith("end");
  });

  it("never plays cues while muted", () => {
    const { result } = renderHook(() => usePracticeTimer(false));
    act(() => result.current.setDrillMins(2));
    act(() => result.current.startDrill());
    act(() => vi.advanceTimersByTime(2 * 60 * 1000));

    expect(result.current.drillDone).toBe(true);
    expect(playCue).not.toHaveBeenCalled();
  });

  it("stop resets everything — no leftover countdown or done flag", () => {
    const { result } = renderHook(() => usePracticeTimer(false));
    act(() => result.current.startDrill());
    act(() => vi.advanceTimersByTime(5000));

    act(() => result.current.stopDrill());

    expect(result.current).toMatchObject({
      drillLeft: 0,
      drillRunning: false,
      drillDone: false,
    });
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.drillLeft).toBe(0);
  });

  it("restart gives the full duration back without leaving the running state", () => {
    const { result } = renderHook(() => usePracticeTimer(false));
    act(() => result.current.setDrillMins(10));
    act(() => result.current.startDrill());
    act(() => vi.advanceTimersByTime(9 * 60 * 1000));
    expect(result.current.drillLeft).toBe(60);

    act(() => result.current.restartDrill());

    expect(result.current.drillLeft).toBe(600);
    expect(result.current.drillRunning).toBe(true);

    // The interval must keep ticking with the fresh value.
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.drillLeft).toBe(598);
  });
});
