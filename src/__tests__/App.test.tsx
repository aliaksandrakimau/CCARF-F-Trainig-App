import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clearMistakes, getMistakes } from "../lib/mistakeStore";
import { QUESTIONS } from "../data/questions";

// Deterministic two-question exam form: q1 (single, D1) and q13 (multi, D2)
// keep the score report assertions exact regardless of shuffle.
const { MOCK_FORM } = vi.hoisted(() => ({ MOCK_FORM: [1, 13] }));
vi.mock("../data/domains", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, buildExamForm: () => MOCK_FORM };
});

import App from "../../App";

const q1 = QUESTIONS.find((q) => q.id === 1)!;

beforeEach(async () => {
  localStorage.clear();
  await clearMistakes();
  // jsdom doesn't implement scrolling; silence navigate()'s call.
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("App — practice mode", () => {
  it("reveals feedback on check and tracks a wrong answer as a mistake", async () => {
    const user = userEvent.setup();
    render(<App />);

    // First bank question is shown; checking requires a selection.
    expect(screen.getByText(q1.q)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check answer" })).toBeDisabled();

    // Pick the wrong option (correct is B).
    await user.click(screen.getByRole("button", { name: /hard cap of 10 iterations/ }));
    expect(screen.getByRole("button", { name: "Check answer" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Check answer" }));

    // Reveal: verdict, missed correct answer and explanation are all shown.
    expect(screen.getByText("Incorrect ✕")).toBeInTheDocument();
    expect(screen.getByText(/Why — B/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Terminate when stop_reason/ })).toBeInTheDocument();

    // The miss lands in IndexedDB and bumps the toolbar badge.
    await screen.findByText(/Review errors · 1/);
    await waitFor(async () => {
      const recs = await getMistakes();
      expect(recs).toEqual([
        expect.objectContaining({ qid: 1, selected: [0], mode: "practice", count: 1, resolved: false }),
      ]);
    });

    // …and shows up on the error review page.
    await user.click(screen.getByRole("button", { name: /Review errors · 1/ }));
    expect(await screen.findByText("Error review")).toBeInTheDocument();
    expect(screen.getByText(/×1 miss/)).toBeInTheDocument();
    expect(screen.getByText("still shaky")).toBeInTheDocument();
  });
});

describe("App — exam mode", () => {
  it("runs a full attempt through submission to the score report and mistake log", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Exam simulation" }));
    await user.click(screen.getByRole("button", { name: "Start exam" }));

    // Fixed mock form: two questions, full clock.
    expect(screen.getByText(/120:00/)).toBeInTheDocument();
    expect(screen.getByText(q1.q)).toBeInTheDocument();

    // Answer q1 correctly…
    await user.click(screen.getByRole("button", { name: /Terminate when stop_reason/ }));
    // …then move to the multi-answer q13 and tick only one of its two correct options.
    await user.click(screen.getByRole("button", { name: "Next →" }));
    await user.click(
      screen.getByRole("button", { name: /clearly differentiate purpose, inputs, and boundaries/ }),
    );

    await user.click(screen.getByRole("button", { name: "Submit exam" }));

    // 1/2 correct → scaled round(100 + 0.5·900) = 550, below the 720 cut.
    expect(await screen.findByText("550")).toBeInTheDocument();
    expect(screen.getByText("1 / 2 correct · 50%")).toBeInTheDocument();
    expect(screen.getByText("BELOW CUT (720)")).toBeInTheDocument();
    expect(screen.getByText("1/1 · 100%")).toBeInTheDocument(); // D1
    expect(screen.getByText("0/1 · 0%")).toBeInTheDocument(); // D2
    expect(screen.getByRole("button", { name: "Retake exam" })).toBeInTheDocument();

    // Answer review reflects each question's outcome.
    expect(screen.getAllByText("Correct ✓")).toHaveLength(1);
    expect(screen.getAllByText("Incorrect ✕")).toHaveLength(1);

    // Submission logs the exam: q13 missed, q1 answered right → no new record.
    await waitFor(async () => {
      const recs = await getMistakes();
      expect(recs).toEqual([
        expect.objectContaining({ qid: 13, selected: [0], mode: "exam", resolved: false }),
      ]);
    });
  });
});
