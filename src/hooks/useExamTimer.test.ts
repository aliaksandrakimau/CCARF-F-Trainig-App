import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useExamTimer } from "./useExamTimer";
import { EXAM_MINUTES } from "../data/domains";

const FULL = EXAM_MINUTES * 60;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

it("starts idle", () => {
  const { result } = renderHook(() => useExamTimer(vi.fn()));
  expect(result.current.timeLeft).toBe(0);
  expect(result.current.examStarted).toBe(false);
});

it("counts down once per second from the full exam duration", () => {
  const { result } = renderHook(() => useExamTimer(vi.fn()));
  act(() => result.current.startTimer());

  expect(result.current.timeLeft).toBe(FULL);
  expect(result.current.examStarted).toBe(true);

  act(() => vi.advanceTimersByTime(5000));
  expect(result.current.timeLeft).toBe(FULL - 5);
});

it("auto-submits exactly once when the clock hits zero", () => {
  const doSubmit = vi.fn();
  const { result } = renderHook(() => useExamTimer(doSubmit));
  act(() => result.current.startTimer());

  act(() => vi.advanceTimersByTime(FULL * 1000));
  expect(doSubmit).toHaveBeenCalledTimes(1);
  expect(result.current.timeLeft).toBe(0);

  // The interval must be gone — extra elapsed time must not re-submit.
  act(() => vi.advanceTimersByTime(10000));
  expect(doSubmit).toHaveBeenCalledTimes(1);
});

it("stopTimer halts the countdown without submitting", () => {
  const doSubmit = vi.fn();
  const { result } = renderHook(() => useExamTimer(doSubmit));
  act(() => result.current.startTimer());
  act(() => vi.advanceTimersByTime(30000));

  act(() => result.current.stopTimer());
  expect(result.current.examStarted).toBe(false);

  act(() => vi.advanceTimersByTime(FULL * 1000));
  expect(doSubmit).not.toHaveBeenCalled();
  expect(result.current.timeLeft).toBe(FULL - 30);
});

it("clears the interval on unmount", () => {
  const doSubmit = vi.fn();
  const { result, unmount } = renderHook(() => useExamTimer(doSubmit));
  act(() => result.current.startTimer());
  unmount();

  act(() => vi.advanceTimersByTime(FULL * 1000));
  expect(doSubmit).not.toHaveBeenCalled();
});
