import { useState, useEffect, useMemo, useRef } from "react";

import { QUESTIONS } from "./src/data/questions";
import { DOMAINS, buildExamForm } from "./src/data/domains";
import { arrEq } from "./src/lib/utils";
import { usePath, navigate } from "./src/lib/router";
import {
  getMistakes,
  recordMistake,
  recordCorrectAnswer,
  subscribeMistakes,
} from "./src/lib/mistakeStore";
import { Header } from "./src/components/Header";
import { Toolbar } from "./src/components/Toolbar";
import { ReviewErrorsView } from "./src/components/ReviewErrorsView";
import { PracticeView } from "./src/components/PracticeView";
import { ExamIntro } from "./src/components/ExamIntro";
import { ExamView } from "./src/components/ExamView";
import { ResultsView } from "./src/components/ResultsView";
import { usePracticeTimer } from "./src/hooks/usePracticeTimer";
import { useExamTimer } from "./src/hooks/useExamTimer";
import type { View, Answers, ExamResults, DomainKey, Question } from "./src/types";
import "./src/styles/theme.css";
import appStyles from "./src/styles/app.module.css";

export default function App() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("ccarf-theme") || "dark";
    } catch {
      return "dark";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("ccarf-theme", theme);
    } catch {
      /* storage unavailable */
    }
    document.body.style.background = theme === "dark" ? "#0F1522" : "#EEF1F6";
  }, [theme]);

  const [sound, setSound] = useState(() => {
    try {
      return localStorage.getItem("ccarf-sound") !== "off";
    } catch {
      return true;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("ccarf-sound", sound ? "on" : "off");
    } catch {
      /* storage unavailable */
    }
  }, [sound]);

  const [view, setView] = useState<View>("practice");
  const [order, setOrder] = useState(() => QUESTIONS.map((q) => q.id));
  const [filter, setFilter] = useState("ALL");
  const [answers, setAnswers] = useState<Answers>({});
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [idx, setIdx] = useState(0);

  // Two routes: "/" (trainer home) and "/review-errors" (tracked mistakes).
  const path = usePath();
  const onReview = path === "/review-errors";

  // Unresolved-mistake count for the toolbar badge. The store subscription
  // keeps it fresh after every practice check, exam submit, or review edit.
  const [mistakeCount, setMistakeCount] = useState(0);
  useEffect(() => {
    const refresh = () => {
      void getMistakes().then((recs) =>
        setMistakeCount(recs.filter((r) => !r.resolved).length),
      );
    };
    refresh();
    return subscribeMistakes(refresh);
  }, []);

  const [examIds, setExamIds] = useState<number[]>([]);
  const [examAnswers, setExamAnswers] = useState<Answers>({});
  const [submitted, setSubmitted] = useState(false);

  const drill = usePracticeTimer(sound);

  const doSubmit = () => {
    setSubmitted(true);
    setView("results");
    examTimer.stopTimer();
  };

  // doSubmit is defined before examTimer because the hook receives it as a callback.
  // This works because doSubmit is only called when the timer expires (never during init),
  // so the closure captures a stable reference to examTimer.stopTimer.
  const examTimer = useExamTimer(doSubmit);

  const filteredIds = useMemo(
    () =>
      order.filter(
        (id) =>
          filter === "ALL" ||
          QUESTIONS.find((q) => q.id === id)!.domain === filter,
      ),
    [order, filter],
  );
  const inExam = view === "exam" || view === "results";
  const list = inExam ? examIds : filteredIds;
  const ans = inExam ? examAnswers : answers;

  useEffect(() => {
    setIdx(0);
  }, [filter, view]);

  // Toggle an option on/off. In practice mode, lock answers after the user checks.
  const toggle = (qid: number, optIdx: number, isMulti: boolean) => {
    if (view === "practice" && checked[qid]) return;
    const setter = inExam ? setExamAnswers : setAnswers;
    setter((prev) => {
      const cur = prev[qid] || [];
      if (isMulti) {
        return {
          ...prev,
          [qid]: cur.includes(optIdx)
            ? cur.filter((x) => x !== optIdx)
            : [...cur, optIdx],
        };
      }
      return { ...prev, [qid]: [optIdx] };
    });
  };

  // Derive visual state for each option: idle → selected → (on reveal) correct/incorrect/missed.
  const optState = (q: Question, optIdx: number) => {
    const sel = (ans[q.id] || []).includes(optIdx);
    const isCorrect = q.correct.includes(optIdx);
    const reveal =
      (view === "practice" && checked[q.id]) || (inExam && submitted);
    if (!reveal) return sel ? ("selected" as const) : ("idle" as const);
    if (isCorrect && sel) return "correct" as const;
    if (isCorrect && !sel) return "missed" as const;
    if (!isCorrect && sel) return "incorrect" as const;
    return "idle" as const;
  };

  const isRight = (q: Question) => arrEq(ans[q.id] || [], q.correct);

  // Mistake tracking — called by PracticeView when an answer is revealed.
  const handlePracticeResult = (qid: number, right: boolean) => {
    if (right) void recordCorrectAnswer(qid);
    else void recordMistake(qid, answers[qid] || [], "practice");
  };

  const startExam = () => {
    drill.stopDrill();
    setExamIds(buildExamForm());
    setExamAnswers({});
    setSubmitted(false);
    setIdx(0);
    setView("exam");
    examTimer.startTimer();
  };

  const resetAll = () => {
    setAnswers({});
    setChecked({});
    setSubmitted(false);
    examTimer.stopTimer();
    setExamIds([]);
    setExamAnswers({});
    drill.stopDrill();
    setIdx(0);
    setOrder(QUESTIONS.map((q) => q.id));
    setFilter("ALL");
    setView("practice");
    if (path !== "/") navigate("/");
  };

  const results = useMemo<ExamResults>(() => {
    const form = examIds
      .map((id) => QUESTIONS.find((q) => q.id === id))
      .filter(Boolean) as Question[];
    const total = form.length;
    const correct = form.filter((q) =>
      arrEq(examAnswers[q.id] || [], q.correct),
    ).length;
    const pct = total ? correct / total : 0;
    // Scale to 100–1000 range matching the real CCAR-F scoring (720 = passing).
    const scaled = Math.round(100 + pct * 900);
    const byDomain = {} as Record<
      DomainKey,
      { total: number; correct: number; pct: number }
    >;
    (Object.keys(DOMAINS) as DomainKey[]).forEach((d) => {
      const qs = form.filter((q) => q.domain === d);
      const c = qs.filter((q) =>
        arrEq(examAnswers[q.id] || [], q.correct),
      ).length;
      byDomain[d] = {
        total: qs.length,
        correct: c,
        pct: qs.length ? c / qs.length : 0,
      };
    });
    return { total, correct, pct, scaled, pass: scaled >= 720, byDomain };
  }, [examAnswers, examIds]);

  // Log exam mistakes once per submission. Done in an effect rather than
  // inside doSubmit because useExamTimer invokes doSubmit from a stale closure
  // (created when the exam timer started), which would miss later answers.
  const examLoggedRef = useRef(false);
  useEffect(() => {
    if (!submitted) {
      examLoggedRef.current = false;
      return;
    }
    if (examLoggedRef.current) return;
    examLoggedRef.current = true;
    examIds.forEach((id) => {
      const q = QUESTIONS.find((x) => x.id === id);
      if (!q) return;
      if (arrEq(examAnswers[id] || [], q.correct)) void recordCorrectAnswer(id);
      else void recordMistake(id, examAnswers[id] || [], "exam");
    });
  }, [submitted, examIds, examAnswers]);

  return (
    <div data-theme={theme} className={appStyles.root}>
      <div className={appStyles.container}>
        <Header />
        <Toolbar
          view={view}
          path={path}
          mistakesCount={mistakeCount}
          sound={sound}
          theme={theme}
          submitted={submitted}
          setView={setView}
          setSound={setSound}
          setTheme={setTheme}
          resetAll={resetAll}
        />

        {onReview ? (
          <ReviewErrorsView />
        ) : (
          <>
            {view === "practice" && (
              <PracticeView
                answers={answers}
                checked={checked}
                filter={filter}
                idx={idx}
                list={filteredIds}
                sound={sound}
                drillMins={drill.drillMins}
                setDrillMins={drill.setDrillMins}
                drillLeft={drill.drillLeft}
                drillRunning={drill.drillRunning}
                drillDone={drill.drillDone}
                setDrillRunning={(v: boolean) => {
                  if (v) drill.startDrill();
                  else drill.stopDrill();
                }}
                startDrill={drill.startDrill}
                stopDrill={drill.stopDrill}
                restartDrill={drill.restartDrill}
                setFilter={setFilter}
                setOrder={setOrder}
                setIdx={setIdx}
                setChecked={setChecked}
                optState={optState}
                toggle={toggle}
                isRight={isRight}
                onRevealResult={handlePracticeResult}
              />
            )}

            {view === "exam" && !examTimer.examStarted && (
              <ExamIntro onStart={startExam} />
            )}

            {view === "exam" && examTimer.examStarted && !submitted && (
              <ExamView
                timeLeft={examTimer.timeLeft}
                examIds={examIds}
                examAnswers={examAnswers}
                idx={idx}
                onSubmit={doSubmit}
                setIdx={setIdx}
                optState={optState}
                toggle={toggle}
              />
            )}

            {view === "results" && (
              <ResultsView
                results={results}
                examIds={examIds}
                examAnswers={examAnswers}
                onRetake={startExam}
                onBackToPractice={() => setView("practice")}
                optState={optState}
                isRight={isRight}
              />
            )}
          </>
        )}

        <footer className={appStyles.footer}>
          Unofficial study aid. Questions are original, written to the public
          CCAR-F exam guide blueprint — not actual exam items. Verify current
          product behavior against Anthropic's documentation.
        </footer>
      </div>
    </div>
  );
}
