import React, { useState, useEffect, useMemo } from "react";

/* ============================================================
   Claude Certified Architect – Foundations (CCAR-F) Practice Trainer
   ============================================================ */

import { T, THEME_CSS } from "./src/lib/theme.js";
import { QUESTIONS } from "./src/data/questions.js";
import {
  DOMAINS,
  EXAM_SIZE,
  EXAM_MINUTES,
  buildExamForm,
} from "./src/data/domains.js";
import { arrEq, shuffle, fmtTime } from "./src/lib/utils.js";
import { playCue } from "./src/lib/audio.js";
import { card, primaryBtn, navBtn } from "./src/components/styles.js";
import { QuestionCard } from "./src/components/QuestionCard.jsx";
import { usePracticeTimer } from "./src/hooks/usePracticeTimer.js";
import { useExamTimer } from "./src/hooks/useExamTimer.js";

/* ============================================================ Main App */
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
    document.body.style.background =
      theme === "dark" ? "#0F1522" : "#EEF1F6";
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

  const [view, setView] = useState("practice"); // practice | exam | results
  const [order, setOrder] = useState(() => QUESTIONS.map((q) => q.id));
  const [filter, setFilter] = useState("ALL");
  const [answers, setAnswers] = useState({}); // practice: id -> number[]
  const [checked, setChecked] = useState({}); // id -> bool (practice)
  const [idx, setIdx] = useState(0);

  const [examIds, setExamIds] = useState([]);
  const [examAnswers, setExamAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const drill = usePracticeTimer(sound);

  const doSubmit = () => {
    setSubmitted(true);
    setView("results");
    examTimer.stopTimer();
  };

  const examTimer = useExamTimer(doSubmit);

  const filteredIds = useMemo(
    () =>
      order.filter(
        (id) =>
          filter === "ALL" ||
          QUESTIONS.find((q) => q.id === id).domain === filter
      ),
    [order, filter]
  );
  const inExam = view === "exam" || view === "results";
  const list = inExam ? examIds : filteredIds;
  const ans = inExam ? examAnswers : answers;
  const curId = list[Math.min(idx, list.length - 1)];
  const cur = QUESTIONS.find((q) => q.id === curId);

  useEffect(() => {
    setIdx(0);
  }, [filter, view]);

  const toggle = (qid, optIdx, isMulti) => {
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

  const optState = (q, optIdx) => {
    const sel = (ans[q.id] || []).includes(optIdx);
    const isCorrect = q.correct.includes(optIdx);
    const reveal =
      (view === "practice" && checked[q.id]) || (inExam && submitted);
    if (!reveal) return sel ? "selected" : "idle";
    if (isCorrect && sel) return "correct";
    if (isCorrect && !sel) return "missed";
    if (!isCorrect && sel) return "incorrect";
    return "idle";
  };

  const isRight = (q) => arrEq(ans[q.id] || [], q.correct);

  // practice stats
  const answeredChecked = list.filter((id) => checked[id]);
  const correctCount = answeredChecked.filter((id) =>
    isRight(QUESTIONS.find((q) => q.id === id))
  ).length;

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
  };

  // results computation
  const results = useMemo(() => {
    const form = examIds
      .map((id) => QUESTIONS.find((q) => q.id === id))
      .filter(Boolean);
    const total = form.length;
    const correct = form.filter((q) =>
      arrEq(examAnswers[q.id] || [], q.correct)
    ).length;
    const pct = total ? correct / total : 0;
    const scaled = Math.round(100 + pct * 900);
    const byDomain = {};
    Object.keys(DOMAINS).forEach((d) => {
      const qs = form.filter((q) => q.domain === d);
      const c = qs.filter((q) =>
        arrEq(examAnswers[q.id] || [], q.correct)
      ).length;
      byDomain[d] = {
        total: qs.length,
        correct: c,
        pct: qs.length ? c / qs.length : 0,
      };
    });
    return { total, correct, pct, scaled, pass: scaled >= 720, byDomain };
  }, [examAnswers, examIds]);

  const gridBg = {
    backgroundColor: T.bg,
    backgroundImage: `linear-gradient(${T.grid} 1px, transparent 1px), linear-gradient(90deg, ${T.grid} 1px, transparent 1px)`,
    backgroundSize: "26px 26px",
  };

  return (
    <div
      data-theme={theme}
      style={{
        ...gridBg,
        minHeight: "100vh",
        fontFamily: T.sans,
        color: T.ink,
        padding: "22px 16px 56px",
      }}
    >
      <style>{THEME_CSS}</style>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        {/* Header */}
        <header style={{ marginBottom: 18 }}>
          <div
            style={{
              fontFamily: T.mono,
              fontSize: 11.5,
              letterSpacing: "0.22em",
              color: T.accent,
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Exam Code · CCAR-F
          </div>
          <h1
            style={{
              margin: "6px 0 4px",
              fontSize: 27,
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
              fontWeight: 800,
            }}
          >
            Claude Certified Architect
            <span
              style={{
                display: "block",
                fontWeight: 500,
                color: T.muted,
                fontSize: 19,
                letterSpacing: 0,
              }}
            >
              Foundations — Practice Trainer
            </span>
          </h1>
          <p
            style={{
              margin: "8px 0 0",
              color: T.muted,
              fontSize: 13.5,
              lineHeight: 1.55,
              maxWidth: 640,
            }}
          >
            {QUESTIONS.length} scenario items across all five blueprint
            domains. Practice mode gives instant feedback and explanations;
            exam mode draws a fresh {EXAM_SIZE}-item form and runs the real{" "}
            {EXAM_MINUTES}-minute clock.
          </p>
        </header>

        {/* Mode tabs */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          {[
            ["practice", "Practice"],
            ["exam", "Exam simulation"],
          ].map(([v, lbl]) => {
            const active = view === v || (v === "exam" && view === "results");
            return (
              <button
                key={v}
                onClick={() =>
                  setView(
                    v === "practice"
                      ? "practice"
                      : submitted
                        ? "results"
                        : "exam"
                  )
                }
                style={{
                  fontFamily: T.sans,
                  fontSize: 13.5,
                  fontWeight: 600,
                  padding: "9px 16px",
                  borderRadius: 9,
                  border: `1.5px solid ${active ? T.accent : T.line}`,
                  cursor: "pointer",
                  background: active ? T.accent : T.surface,
                  color: active ? T.onAccent : T.ink,
                }}
              >
                {lbl}
              </button>
            );
          })}
          <div style={{ flex: 1 }} />
          <button
            onClick={() => {
              const on = !sound;
              setSound(on);
              if (on) playCue("correct");
            }}
            title={
              sound
                ? "Mute answer feedback sounds"
                : "Play a sound on each checked answer"
            }
            style={{
              fontFamily: T.sans,
              fontSize: 13,
              fontWeight: 600,
              padding: "9px 14px",
              borderRadius: 9,
              border: `1.5px solid ${T.line}`,
              background: T.surface,
              color: sound ? T.accent : T.faint,
              cursor: "pointer",
            }}
          >
            {sound ? "♪ Sound" : "♪̸ Muted"}
          </button>
          <button
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            title={
              theme === "dark"
                ? "Switch to light theme"
                : "Switch to dark theme"
            }
            style={{
              fontFamily: T.sans,
              fontSize: 13,
              fontWeight: 600,
              padding: "9px 14px",
              borderRadius: 9,
              border: `1.5px solid ${T.line}`,
              background: T.surface,
              color: T.muted,
              cursor: "pointer",
            }}
          >
            {theme === "dark" ? "☀ Light" : "☾ Dark"}
          </button>
          <button
            onClick={resetAll}
            style={{
              fontFamily: T.sans,
              fontSize: 13,
              fontWeight: 600,
              padding: "9px 14px",
              borderRadius: 9,
              border: `1.5px solid ${T.line}`,
              background: T.surface,
              color: T.muted,
              cursor: "pointer",
            }}
          >
            Reset
          </button>
        </div>

        {/* ---------------- PRACTICE ---------------- */}
        {view === "practice" && (
          <>
            {/* filter + shuffle */}
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <span
                style={{
                  fontFamily: T.mono,
                  fontSize: 11,
                  color: T.faint,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Domain
              </span>
              {["ALL", ...Object.keys(DOMAINS)].map((d) => {
                const active = filter === d;
                return (
                  <button
                    key={d}
                    onClick={() => setFilter(d)}
                    title={d === "ALL" ? "All domains" : DOMAINS[d].label}
                    style={{
                      fontFamily: T.mono,
                      fontSize: 11.5,
                      fontWeight: 600,
                      padding: "5px 10px",
                      borderRadius: 7,
                      border: `1.5px solid ${active ? T.accent : T.line}`,
                      background: active ? T.accentSoft : T.surface,
                      color: active ? T.accent : T.muted,
                      cursor: "pointer",
                    }}
                  >
                    {d}
                  </button>
                );
              })}
              <div style={{ flex: 1 }} />
              <button
                onClick={() => {
                  setOrder(shuffle(QUESTIONS.map((q) => q.id)));
                  setIdx(0);
                }}
                style={{
                  fontFamily: T.sans,
                  fontSize: 12.5,
                  fontWeight: 600,
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: `1.5px solid ${T.line}`,
                  background: T.surface,
                  color: T.muted,
                  cursor: "pointer",
                }}
              >
                ⤮ Shuffle
              </button>
            </div>

            {/* practice timer */}
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <span
                style={{
                  fontFamily: T.mono,
                  fontSize: 11,
                  color: T.faint,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Timer
              </span>
              {[2, 5, 10, 20, 30, 60].map((m) => {
                const active = drill.drillMins === m;
                return (
                  <button
                    key={m}
                    onClick={() => drill.setDrillMins(m)}
                    disabled={drill.drillRunning}
                    title={
                      drill.drillRunning
                        ? "Stop the timer to change its length"
                        : m === 2
                          ? "2 minutes — the real exam's per-question pace"
                          : `${m}-minute drill`
                    }
                    style={{
                      fontFamily: T.mono,
                      fontSize: 11.5,
                      fontWeight: 600,
                      padding: "5px 10px",
                      borderRadius: 7,
                      border: `1.5px solid ${active ? T.accent : T.line}`,
                      background: active ? T.accentSoft : T.surface,
                      color: active ? T.accent : T.muted,
                      cursor: drill.drillRunning ? "default" : "pointer",
                      opacity: drill.drillRunning && !active ? 0.5 : 1,
                    }}
                  >
                    {m}m
                  </button>
                );
              })}

              {(drill.drillRunning ||
                drill.drillLeft > 0 ||
                drill.drillDone) && (
                <span
                  style={{
                    fontFamily: T.mono,
                    fontSize: 14,
                    fontWeight: 700,
                    padding: "5px 11px",
                    borderRadius: 8,
                    color:
                      drill.drillDone || drill.drillLeft < 60 ? T.bad : T.ink,
                    background: T.surface,
                    border: `1.5px solid ${
                      drill.drillDone || drill.drillLeft < 60
                        ? T.badLine
                        : T.line
                    }`,
                  }}
                >
                  ⏱ {drill.drillDone ? "Time's up" : fmtTime(drill.drillLeft)}
                </span>
              )}

              <div style={{ flex: 1 }} />

              {drill.drillRunning && (
                <button
                  onClick={() => drill.setDrillRunning(false)}
                  style={{
                    fontFamily: T.sans,
                    fontSize: 12.5,
                    fontWeight: 600,
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: `1.5px solid ${T.line}`,
                    background: T.surface,
                    color: T.muted,
                    cursor: "pointer",
                  }}
                >
                  ⏸ Pause
                </button>
              )}
              {!drill.drillRunning &&
                drill.drillLeft > 0 &&
                !drill.drillDone && (
                  <button
                    onClick={() => drill.setDrillRunning(true)}
                    style={{
                      fontFamily: T.sans,
                      fontSize: 12.5,
                      fontWeight: 600,
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: `1.5px solid ${T.accentLine}`,
                      background: T.accentSoft,
                      color: T.accent,
                      cursor: "pointer",
                    }}
                  >
                    ▶ Resume
                  </button>
                )}
              <button
                onClick={
                  drill.drillRunning || drill.drillLeft > 0 || drill.drillDone
                    ? drill.stopDrill
                    : drill.startDrill
                }
                style={{
                  fontFamily: T.sans,
                  fontSize: 12.5,
                  fontWeight: 600,
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: `1.5px solid ${
                    drill.drillRunning ||
                    drill.drillLeft > 0 ||
                    drill.drillDone
                      ? T.line
                      : T.accent
                  }`,
                  background:
                    drill.drillRunning ||
                    drill.drillLeft > 0 ||
                    drill.drillDone
                      ? T.surface
                      : T.accent,
                  color:
                    drill.drillRunning ||
                    drill.drillLeft > 0 ||
                    drill.drillDone
                      ? T.muted
                      : T.onAccent,
                  cursor: "pointer",
                }}
              >
                {drill.drillRunning ||
                drill.drillLeft > 0 ||
                drill.drillDone
                  ? "■ Stop"
                  : `▶ Start ${drill.drillMins}m`}
              </button>
            </div>

            {/* progress bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 4,
                  background: T.line,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${((idx + 1) / list.length) * 100}%`,
                    height: "100%",
                    background: T.accent,
                    transition: "width .2s",
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily: T.mono,
                  fontSize: 12,
                  color: T.muted,
                }}
              >
                {String(idx + 1).padStart(2, "0")} /{" "}
                {String(list.length).padStart(2, "0")}
              </span>
              <span
                style={{
                  fontFamily: T.mono,
                  fontSize: 12,
                  color: T.good,
                  fontWeight: 700,
                }}
              >
                {correctCount}/{answeredChecked.length || 0} ✓
              </span>
            </div>

            {cur && (
              <QuestionCard
                q={cur}
                num={idx + 1}
                answers={answers}
                optState={optState}
                toggle={toggle}
                reveal={!!checked[cur.id]}
                isRight={isRight(cur)}
              />
            )}

            {/* actions */}
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 16,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => setIdx((i) => Math.max(0, i - 1))}
                disabled={idx === 0}
                style={navBtn(idx === 0)}
              >
                ← Previous
              </button>

              {!checked[cur?.id] ? (
                <button
                  onClick={() => {
                    setChecked((c) => ({ ...c, [cur.id]: true }));
                    if (sound) playCue(isRight(cur) ? "correct" : "wrong");
                  }}
                  disabled={!(answers[cur?.id] || []).length}
                  style={primaryBtn(!(answers[cur?.id] || []).length)}
                >
                  Check answer
                </button>
              ) : (
                <button
                  onClick={() =>
                    setIdx((i) => Math.min(list.length - 1, i + 1))
                  }
                  disabled={idx >= list.length - 1}
                  style={primaryBtn(idx >= list.length - 1)}
                >
                  Next question →
                </button>
              )}
              <div style={{ flex: 1 }} />
              <button
                onClick={() =>
                  setIdx((i) => Math.min(list.length - 1, i + 1))
                }
                disabled={idx >= list.length - 1}
                style={navBtn(idx >= list.length - 1)}
              >
                Skip →
              </button>
            </div>
          </>
        )}

        {/* ---------------- EXAM ---------------- */}
        {view === "exam" && !examTimer.examStarted && (
          <div style={card()}>
            <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>
              Exam simulation
            </h2>
            <p
              style={{
                color: T.muted,
                fontSize: 14,
                lineHeight: 1.6,
                margin: "0 0 14px",
              }}
            >
              A fresh {EXAM_SIZE}-question form is drawn from the{" "}
              {QUESTIONS.length}-item bank each time, weighted to the blueprint
              (
              {Object.keys(DOMAINS)
                .map((d) => `${d} ${EXAM_QUOTAS[d]}`)
                .join(" · ")}
              ) and shuffled. The clock runs {EXAM_MINUTES} minutes, exactly
              like the real exam. No feedback until you submit, then you get a
              full score report and answer review.
            </p>
            <ul
              style={{
                color: T.muted,
                fontSize: 13.5,
                lineHeight: 1.7,
                margin: "0 0 16px",
                paddingLeft: 18,
              }}
            >
              <li>Passing standard on the real exam: scaled 720 / 1000.</li>
              <li>
                The scaled number here is an approximation for practice only.
              </li>
              <li>
                Practice-mode filters and shuffling never affect the exam form.
              </li>
            </ul>
            <button onClick={startExam} style={primaryBtn(false)}>
              Start exam
            </button>
          </div>
        )}

        {view === "exam" &&
          examTimer.examStarted &&
          !submitted &&
          cur && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    fontFamily: T.mono,
                    fontSize: 15,
                    fontWeight: 700,
                    color: examTimer.timeLeft < 120 ? T.bad : T.ink,
                    background: T.surface,
                    border: `1.5px solid ${
                      examTimer.timeLeft < 120 ? T.badLine : T.line
                    }`,
                    padding: "6px 12px",
                    borderRadius: 8,
                  }}
                >
                  ⏱ {fmtTime(examTimer.timeLeft)}
                </div>
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 4,
                    background: T.line,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${((idx + 1) / list.length) * 100}%`,
                      height: "100%",
                      background: T.accent,
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: T.mono,
                    fontSize: 12,
                    color: T.muted,
                  }}
                >
                  {idx + 1}/{list.length} · answered{" "}
                  {Object.keys(examAnswers).length}
                </span>
              </div>

              <QuestionCard
                q={cur}
                num={idx + 1}
                answers={examAnswers}
                optState={optState}
                toggle={toggle}
                reveal={false}
              />

              {/* jump grid */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  margin: "16px 0",
                }}
              >
                {list.map((id, i) => {
                  const done = (examAnswers[id] || []).length > 0;
                  const here = i === idx;
                  return (
                    <button
                      key={id}
                      onClick={() => setIdx(i)}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 7,
                        fontFamily: T.mono,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        border: `1.5px solid ${
                          here ? T.accent : done ? T.accentLine : T.line
                        }`,
                        background: here
                          ? T.accent
                          : done
                            ? T.accentSoft
                            : T.surface,
                        color: here
                          ? T.onAccent
                          : done
                            ? T.accent
                            : T.faint,
                      }}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => setIdx((i) => Math.max(0, i - 1))}
                  disabled={idx === 0}
                  style={navBtn(idx === 0)}
                >
                  ← Previous
                </button>
                <button
                  onClick={() =>
                    setIdx((i) => Math.min(list.length - 1, i + 1))
                  }
                  disabled={idx >= list.length - 1}
                  style={navBtn(idx >= list.length - 1)}
                >
                  Next →
                </button>
                <div style={{ flex: 1 }} />
                <button
                  onClick={doSubmit}
                  style={{
                    ...primaryBtn(false),
                    background: T.good,
                    borderColor: T.good,
                  }}
                >
                  Submit exam
                </button>
              </div>
            </>
          )}

        {/* ---------------- RESULTS ---------------- */}
        {view === "results" && (
          <>
            <div
              style={{
                ...card(),
                textAlign: "center",
                borderColor: results.pass ? T.goodLine : T.badLine,
              }}
            >
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 11,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: T.muted,
                }}
              >
                Approximate scaled score
              </div>
              <div
                style={{
                  fontSize: 52,
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: results.pass ? T.good : T.bad,
                  lineHeight: 1.05,
                  margin: "4px 0",
                }}
              >
                {results.scaled}
              </div>
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 13,
                  color: T.muted,
                }}
              >
                {results.correct} / {results.total} correct ·{" "}
                {Math.round(results.pct * 100)}%
              </div>
              <div
                style={{
                  display: "inline-block",
                  marginTop: 12,
                  padding: "6px 16px",
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: 14,
                  color: results.pass ? T.good : T.bad,
                  background: results.pass ? T.goodSoft : T.badSoft,
                  border: `1.5px solid ${
                    results.pass ? T.goodLine : T.badLine
                  }`,
                }}
              >
                {results.pass ? "PASS (≥ 720)" : "BELOW CUT (720)"}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: T.faint,
                  marginTop: 10,
                }}
              >
                Practice estimate only — the real exam uses scaled scoring
                across 60 items.
              </div>
            </div>

            {/* domain breakdown */}
            <div style={{ ...card(), padding: "16px 18px" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>
                Performance by domain
              </h3>
              {Object.keys(DOMAINS).map((d) => {
                const r = results.byDomain[d];
                const p = Math.round(r.pct * 100);
                return (
                  <div key={d} style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginBottom: 5,
                      }}
                    >
                      <span style={{ fontSize: 13, color: T.ink }}>
                        <span
                          style={{
                            fontFamily: T.mono,
                            fontWeight: 700,
                            color: T.accent,
                          }}
                        >
                          {d}
                        </span>{" "}
                        {DOMAINS[d].label}{" "}
                        <span style={{ color: T.faint }}>
                          · {DOMAINS[d].weight}% of exam
                        </span>
                      </span>
                      <span
                        style={{
                          fontFamily: T.mono,
                          fontSize: 12,
                          color: T.muted,
                        }}
                      >
                        {r.correct}/{r.total} · {p}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: 7,
                        borderRadius: 4,
                        background: T.line,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${p}%`,
                          height: "100%",
                          background:
                            p >= 70
                              ? T.good
                              : p >= 50
                                ? T.amber
                                : T.bad,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* review */}
            <h3 style={{ margin: "20px 0 12px", fontSize: 15 }}>
              Answer review
            </h3>
            {examIds.map((id, i) => {
              const q = QUESTIONS.find((x) => x.id === id);
              return (
                <QuestionCard
                  key={id}
                  q={q}
                  num={i + 1}
                  answers={examAnswers}
                  optState={optState}
                  toggle={() => {}}
                  reveal={true}
                  isRight={isRight(q)}
                  readOnly
                />
              );
            })}

            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 16,
                flexWrap: "wrap",
              }}
            >
              <button onClick={startExam} style={primaryBtn(false)}>
                Retake exam
              </button>
              <button
                onClick={() => setView("practice")}
                style={navBtn(false)}
              >
                Back to practice
              </button>
            </div>
          </>
        )}

        <footer
          style={{
            marginTop: 40,
            paddingTop: 16,
            borderTop: `1px solid ${T.line}`,
            color: T.faint,
            fontSize: 11.5,
            lineHeight: 1.6,
          }}
        >
          Unofficial study aid. Questions are original, written to the public
          CCAR-F exam guide blueprint — not actual exam items. Verify current
          product behavior against Anthropic's documentation.
        </footer>
      </div>
    </div>
  );
}
