import React, { useState, useEffect, useMemo, useRef } from "react";

/* =========================================================================
   Claude Certified Architect – Foundations (CCAR-F) Practice Trainer
   Single-file React artifact. No external libraries, no browser storage.
   ========================================================================= */

const T = {
  bg: "#EEF1F6",
  grid: "rgba(41,75,181,0.05)",
  surface: "#FFFFFF",
  ink: "#16202E",
  muted: "#5B6B80",
  faint: "#8A99AD",
  line: "#D7DEEA",
  accent: "#294BB5",
  accentSoft: "#E8EDFB",
  accentLine: "#B9C6EE",
  amber: "#B26A00",
  amberSoft: "#FBEFD9",
  good: "#1F8A5B",
  goodSoft: "#E4F4EC",
  goodLine: "#A7DBC2",
  bad: "#C0392B",
  badSoft: "#FBEAE7",
  badLine: "#EBB8B0",
  mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  sans: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
};

const DOMAINS = {
  D1: { label: "Agentic Architecture & Orchestration", weight: 27 },
  D2: { label: "Tool Design & MCP Integration", weight: 18 },
  D3: { label: "Claude Code Configuration & Workflows", weight: 20 },
  D4: { label: "Prompt Engineering & Structured Output", weight: 20 },
  D5: { label: "Context Management & Reliability", weight: 15 },
};

const QUESTIONS = [
  {
    id: 1, domain: "D1", type: "single",
    q: "A developer's agentic loop decides when to stop by scanning Claude's text output for phrases like \"I'm done\" or \"task complete.\" Sometimes it stops early, sometimes it loops forever. What is the correct fix?",
    options: [
      "Add a hard cap of 10 iterations as the primary stopping mechanism.",
      "Terminate when stop_reason is \"end_turn\" and continue while it is \"tool_use\".",
      "Ask Claude to always print \"FINISHED\" and parse for that token.",
      "Stop when the response contains no tool calls, ignoring stop_reason.",
    ],
    correct: [1],
    exp: "Loop control must be driven by stop_reason (tool_use → continue, end_turn → stop). Parsing natural-language signals, using arbitrary iteration caps as the primary mechanism, or checking for assistant text are all anti-patterns from Task 1.1.",
  },
  {
    id: 2, domain: "D1", type: "single",
    q: "Your coordinator always routes every request through the full four-subagent pipeline (web search → document analysis → synthesis → report), even trivial factual lookups. Latency and cost are too high. Best fix?",
    options: [
      "Merge all subagents into one universal agent holding every tool.",
      "Have the coordinator analyze the request and dynamically select which subagents to invoke.",
      "Cache prior runs and reuse the results.",
      "Always run all four subagents in parallel to cut latency.",
    ],
    correct: [1],
    exp: "Task 1.2: the coordinator should assess query requirements and dynamically select subagents rather than always running the full pipeline. Merging breaks separation of concerns; caching is speculative; parallelism reduces latency but not the wasted work.",
  },
  {
    id: 3, domain: "D1", type: "single",
    q: "The coordinator invokes the synthesis subagent, but the report is missing the web-search and document-analysis findings — even though those subagents succeeded. Most likely root cause?",
    options: [
      "The synthesis subagent didn't inherit the coordinator's history automatically, and the findings were never explicitly passed in its prompt.",
      "The synthesis subagent's allowedTools is missing the Task tool.",
      "Subagents share memory and a race condition dropped the data.",
      "The synthesis model's context window is too small for a report.",
    ],
    correct: [0],
    exp: "Task 1.3: subagents run in isolated context and do NOT inherit parent history — prior findings must be included explicitly in the subagent's prompt. Task on allowedTools governs spawning, not context passing; there is no shared memory.",
  },
  {
    id: 4, domain: "D1", type: "single",
    q: "Two independent subagents (web search, document analysis) have no dependency on each other, but the coordinator invokes them across separate turns, doubling latency. Correct way to parallelize?",
    options: [
      "Give both subagents each other's tools so they proceed independently.",
      "Emit multiple Task tool calls in a single coordinator response.",
      "Lower max_tokens so each subagent finishes faster.",
      "Merge them into one subagent that does both jobs back-to-back.",
    ],
    correct: [1],
    exp: "Task 1.3: parallel subagents are spawned by emitting multiple Task calls in one coordinator response. Cross-tool access and merging don't create parallelism; max_tokens is unrelated.",
  },
  {
    id: 5, domain: "D1", type: "single",
    q: "You finished an expensive codebase analysis and want to compare two refactoring strategies that both start from that same baseline, without redoing the analysis. Most appropriate mechanism?",
    options: [
      "Use --resume with the same session name for both strategies.",
      "Use fork_session to create independent branches from the shared baseline.",
      "Start two fresh sessions and paste the analysis into each.",
      "Run /compact and explore both strategies in one session.",
    ],
    correct: [1],
    exp: "Task 1.7: fork_session is purpose-built for branching from a shared analysis baseline to explore divergent approaches. --resume continues one linear session; pasting is lossy; /compact doesn't branch.",
  },
  {
    id: 6, domain: "D1", type: "single",
    q: "You ask Claude to \"add comprehensive tests to a large legacy codebase\" whose structure and dependencies are unknown up front. Best decomposition strategy?",
    options: [
      "A fixed sequential pipeline (prompt chaining) with predefined steps per file.",
      "Adaptive decomposition: map structure, identify high-impact areas, then build a prioritized plan that adapts as dependencies are discovered.",
      "Read all files into context at once and generate every test in one pass.",
      "Cap the work at 20 tests and stop when reached.",
    ],
    correct: [1],
    exp: "Task 1.6: open-ended investigation calls for adaptive decomposition. Prompt chaining fits predictable multi-aspect work; loading everything dilutes attention; arbitrary caps are an anti-pattern.",
  },
  {
    id: 7, domain: "D1", type: "single",
    q: "Policy forbids refunds over $500 without a human. The prompt says \"never refund more than $500 without escalating,\" yet ~3% of the time the agent still does. What gives a deterministic guarantee?",
    options: [
      "Strengthen the system-prompt wording and add ALL-CAPS \"NEVER\".",
      "Add few-shot examples of correct escalation for large refunds.",
      "Implement a tool-call interception hook that blocks process_refund over $500 and redirects to escalation.",
      "Lower the model temperature so it follows instructions more strictly.",
    ],
    correct: [2],
    exp: "Tasks 1.5 / 1.4: when a business rule requires guaranteed compliance, use programmatic enforcement (a hook), not probabilistic prompt-following. Prompt/few-shot/temperature approaches all leave a non-zero failure rate.",
  },
  {
    id: 8, domain: "D2", type: "single",
    q: "Two MCP tools have near-identical descriptions: analyze_content (\"Analyzes content\") and analyze_document (\"Analyzes documents\"). The agent keeps confusing them. Most effective first step?",
    options: [
      "Rename one tool and rewrite descriptions to remove functional overlap and clearly state purpose, inputs, and boundaries.",
      "Add 8 few-shot tool-selection examples to the system prompt.",
      "Build a routing layer that pre-selects a tool from keywords.",
      "Consolidate both into one analyze tool that picks the backend internally.",
    ],
    correct: [0],
    exp: "Task 2.1: tool descriptions are the primary mechanism LLMs use to select tools — rewriting to eliminate overlap is the low-effort, high-leverage first step. Few-shot adds tokens without fixing the cause; a router is over-engineered; consolidation is a bigger change than a \"first step\" warrants.",
  },
  {
    id: 9, domain: "D2", type: "single",
    q: "All your MCP tools return the same string on failure: \"Operation failed.\" The agent can't tell whether to retry. What improves recovery?",
    options: [
      "Log all errors server-side and review them manually later.",
      "Return structured error metadata: errorCategory (transient/validation/permission), an isRetryable boolean, and a human-readable description.",
      "Automatically retry any failed call three times with exponential backoff.",
      "Return an empty result marked as success so the agent keeps going.",
    ],
    correct: [1],
    exp: "Task 2.2: structured error metadata lets the agent make appropriate recovery decisions. Blind retries waste attempts on non-retryable errors; marking failure as success suppresses the error and risks bad outputs.",
  },
  {
    id: 10, domain: "D2", type: "single",
    q: "Several MCP tools return timestamps in different formats (Unix epoch, ISO 8601, numeric status codes) and the model keeps misreading them. Cleanest fix?",
    options: [
      "Instruct the model to handle every possible timestamp format.",
      "Implement a PostToolUse hook that normalizes the formats before the model sees the results.",
      "Ask each MCP tool owner to rewrite their APIs to a shared format.",
      "Add few-shot examples of every timestamp format to the prompt.",
    ],
    correct: [1],
    exp: "Task 1.5 / 2.x: a PostToolUse hook normalizes heterogeneous data deterministically before the model processes it. Prompt/few-shot approaches are probabilistic; rewriting third-party APIs is impractical.",
  },
  {
    id: 11, domain: "D2", type: "single",
    q: "A shared MCP server needs a GitHub token and must be available to everyone who clones the repo; developers also want to add personal experimental servers. How do you configure this?",
    options: [
      "Put both shared and personal servers in the project's .mcp.json.",
      "Put the shared server in project-scoped .mcp.json with ${GITHUB_TOKEN} expansion; put personal servers in user-scoped ~/.claude.json.",
      "Hardcode the token in .mcp.json and commit it so everyone has access.",
      "Put everything in ~/.claude.json so it's available across all projects.",
    ],
    correct: [1],
    exp: "Task 2.4: project-scoped .mcp.json with env-var expansion for shared team tooling; user-scoped ~/.claude.json for personal/experimental servers. Committing a token leaks secrets; the other options mix scopes incorrectly.",
  },
  {
    id: 12, domain: "D2", type: "single",
    q: "A subagent has 18 tools available and frequently picks the wrong one. Best fix?",
    options: [
      "Restrict the tool set to the 4–5 tools relevant to its role.",
      "Add more few-shot examples covering all 18 tools.",
      "Increase max_tokens so it can reason over more tools.",
      "Force tool_choice to a fixed tool for every call.",
    ],
    correct: [0],
    exp: "Task 2.3: giving an agent too many tools degrades selection reliability by increasing decision complexity. Scope each agent to only the tools its role needs.",
  },
  {
    id: 13, domain: "D2", type: "multi",
    q: "Which are effective ways to improve tool-selection reliability when two MCP tools have overlapping descriptions? (Select TWO.)",
    options: [
      "Rewrite the descriptions to clearly differentiate purpose, inputs, and boundaries.",
      "Rename one tool to eliminate functional overlap and reflect its specific role.",
      "Give the agent more tools so it has additional alternatives.",
      "Add an arbitrary iteration cap to the agent loop.",
    ],
    correct: [0, 1],
    exp: "Task 2.1: differentiate via clear descriptions and rename to remove overlap. Adding tools worsens selection; iteration caps are unrelated to tool routing.",
  },
  {
    id: 14, domain: "D3", type: "single",
    q: "Test files are scattered throughout the codebase next to their sources (Button.test.tsx beside Button.tsx). You want Claude to apply one set of test conventions regardless of location. Most maintainable approach?",
    options: [
      "Create .claude/rules/ files with YAML frontmatter glob patterns (e.g. **/*.test.tsx).",
      "Put every convention in the root CLAUDE.md under headers and rely on Claude to infer which applies.",
      "Create a skill in .claude/skills/ for each code type.",
      "Place a separate CLAUDE.md in every subdirectory.",
    ],
    correct: [0],
    exp: "Task 3.3: path-scoped rules with glob patterns apply conventions by file type regardless of directory — ideal for scattered test files. Root CLAUDE.md relies on inference; skills need manual invocation; per-directory CLAUDE.md can't span many directories.",
  },
  {
    id: 15, domain: "D3", type: "single",
    q: "The task is to add one date-validation check to a single function that already has a clear stack trace. Which approach is appropriate?",
    options: [
      "Enter plan mode and fully explore the codebase before changing anything.",
      "Use direct execution — the change is narrow and well understood.",
      "Fork the session and compare multiple implementation approaches.",
      "Delegate to an Explore subagent to gather project-wide context first.",
    ],
    correct: [1],
    exp: "Task 3.4: direct execution suits simple, well-scoped changes. Plan mode and Explore are for complex, multi-file, or architectural work — overkill here.",
  },
  {
    id: 16, domain: "D3", type: "single",
    q: "A new teammate reports Claude isn't following the team's coding standards, though they work for you. The standards live in your ~/.claude/CLAUDE.md. Diagnosis and fix?",
    options: [
      "They're in user-level config, which isn't shared via version control; move them to project-level .claude/CLAUDE.md (or root CLAUDE.md).",
      "The teammate should run /compact to reload the standards.",
      "Convert the standards into a skill in ~/.claude/skills/.",
      "The teammate's context window is too small; upgrade their model tier.",
    ],
    correct: [0],
    exp: "Task 3.1: ~/.claude/CLAUDE.md is user-level and not shared through version control — the classic hierarchy bug. Move to project scope so all teammates receive it.",
  },
  {
    id: 17, domain: "D3", type: "single",
    q: "A skill runs verbose codebase analysis and floods the main conversation, degrading later responses. Which frontmatter option addresses this?",
    options: [
      "allowed-tools restricting it to read-only tools.",
      "argument-hint to prompt for parameters.",
      "context: fork to run the skill in an isolated sub-agent context.",
      "Moving the skill from .claude/skills/ to ~/.claude/skills/.",
    ],
    correct: [2],
    exp: "Task 3.2: context: fork isolates a skill's verbose output in a sub-agent context so it doesn't pollute the main session. The other options solve different problems.",
  },
  {
    id: 18, domain: "D3", type: "single",
    q: "Your CI job runs `claude \"Review this PR for security issues\"` but the job hangs waiting for interactive input. Correct way to run Claude Code non-interactively?",
    options: [
      "Add the -p / --print flag.",
      "Set an environment variable CLAUDE_HEADLESS=true.",
      "Add a --batch flag.",
      "Redirect stdin from /dev/null.",
    ],
    correct: [0],
    exp: "Task 3.6: -p / --print runs Claude Code in non-interactive mode — it processes the prompt, prints to stdout, and exits. The other options reference non-existent features or Unix workarounds.",
  },
  {
    id: 19, domain: "D3", type: "single",
    q: "You want a /deploy-check slash command to be available to everyone who clones or pulls the repo. Where do you put it?",
    options: [
      ".claude/commands/ in the project repository.",
      "~/.claude/commands/ in each developer's home directory.",
      "The root CLAUDE.md file.",
      "A .claude/config.json file with a commands array.",
    ],
    correct: [0],
    exp: "Task 3.2: project-scoped commands live in .claude/commands/ and are version-controlled, so they reach everyone. ~/.claude/commands/ is personal; CLAUDE.md is for context, not command definitions; the config.json array doesn't exist.",
  },
  {
    id: 20, domain: "D4", type: "single",
    q: "Your CI review agent flags too many trivial style issues, so developers now ignore it — including its accurate security findings. Adding \"be conservative, only report high-confidence issues\" didn't help. Most effective approach?",
    options: [
      "Write specific categorical criteria defining which issues to report (bugs, security) vs skip (minor style, local patterns).",
      "Have the model self-report a confidence score and filter below a threshold.",
      "Switch to a larger model with more parameters.",
      "Run the review three times and only report issues appearing in all runs.",
    ],
    correct: [0],
    exp: "Task 4.1: explicit categorical criteria beat vague \"be conservative\" language and confidence filtering. Self-reported confidence is poorly calibrated; a bigger model doesn't fix criteria; consensus-of-3 suppresses real, intermittently-caught bugs.",
  },
  {
    id: 21, domain: "D4", type: "single",
    q: "An extraction pipeline retries with error feedback on JSON validation failures. It fixes format errors, but one field keeps failing: the information simply isn't in the source document. Correct understanding?",
    options: [
      "Increase the retry count; it will eventually succeed.",
      "Retries can't conjure absent information — make the schema field nullable/optional instead.",
      "Switch from tool_use to plain text to give the model more freedom.",
      "Raise temperature on retry so the model tries harder.",
    ],
    correct: [1],
    exp: "Tasks 4.3 / 4.4: retries help with format and structural errors, not information that is absent from the source. Nullable/optional fields let the model return null instead of fabricating a value.",
  },
  {
    id: 22, domain: "D4", type: "single",
    q: "Two workflows: (1) a blocking pre-merge check a developer waits on live, and (2) an overnight tech-debt report needed by morning. A manager wants both on the Message Batches API for the 50% savings. How do you evaluate this?",
    options: [
      "Move both to batch with status polling for completion.",
      "Use batch only for the overnight report; keep the pre-merge check on the synchronous API.",
      "Keep both synchronous to avoid batch result-ordering issues.",
      "Move both to batch with a timeout fallback to synchronous.",
    ],
    correct: [1],
    exp: "Task 4.5: batch gives 50% savings but has up to a 24-hour window and no latency SLA — unsuitable for blocking pre-merge checks, ideal for overnight jobs. Ordering is handled via custom_id, so that objection is a misconception.",
  },
  {
    id: 23, domain: "D4", type: "single",
    q: "Your extraction service must ALWAYS return structured data via a tool call (never conversational text), but the document type — and therefore which schema — is unknown in advance. Which tool_choice setting fits?",
    options: [
      "tool_choice: \"auto\"",
      "tool_choice: \"any\"",
      "tool_choice: {\"type\":\"tool\",\"name\":\"extract_invoice\"}",
      "Omit tool_choice entirely.",
    ],
    correct: [1],
    exp: "Tasks 2.3 / 4.3: \"any\" forces the model to call a tool while letting it choose which schema — right when the document type is unknown. \"auto\" may return text; forcing a specific tool assumes the type; omitting defaults to auto.",
  },
  {
    id: 24, domain: "D5", type: "single",
    q: "In a multi-source research system, the synthesis step summarizes findings but loses which source each claim came from, and when two credible sources report conflicting statistics it silently picks one. How do you fix both?",
    options: [
      "Tell the synthesis agent to \"be careful about sources.\"",
      "Require subagents to emit structured claim-source mappings that synthesis preserves, and annotate conflicts with source attribution and publication dates rather than picking one value.",
      "Use only a single source per topic to avoid conflicts.",
      "Have the coordinator manually resolve every conflict by re-reading all sources.",
    ],
    correct: [1],
    exp: "Task 5.6: preserve structured claim-source mappings through synthesis and annotate conflicts (with dates) instead of arbitrarily selecting. Prompt nudges, single-source, and manual coordinator resolution don't scale or lose information.",
  },
  {
    id: 25, domain: "D5", type: "single",
    q: "Over a long support conversation, exact refund amounts and dates get compressed into vague summaries, and the agent later cites wrong figures. Best mitigation?",
    options: [
      "Extract transactional facts (amounts, dates, order #s) into a persistent \"case facts\" block included in every prompt, outside the summarized history.",
      "Summarize more aggressively to save tokens.",
      "Rely on the model to remember the earlier details.",
      "Move all details to the exact middle of the prompt.",
    ],
    correct: [0],
    exp: "Task 5.1: keep transactional facts in a persistent case-facts block outside summarized history so numbers/dates survive. Aggressive summarization worsens loss; the middle of long inputs is where models drop information (lost-in-the-middle).",
  },
  {
    id: 26, domain: "D5", type: "single",
    q: "A customer explicitly says \"I want to speak to a human.\" The issue looks simple and the agent could resolve it. Correct behavior?",
    options: [
      "Honor the explicit request for a human immediately, without first attempting investigation.",
      "Resolve it autonomously since it's simple, ignoring the request.",
      "Run sentiment analysis to decide whether to escalate.",
      "Ask the model for a confidence score before deciding.",
    ],
    correct: [0],
    exp: "Task 5.2: honor explicit requests for a human immediately. Sentiment and self-reported confidence are unreliable proxies for whether to escalate.",
  },
  {
    id: 27, domain: "D5", type: "multi",
    q: "When escalating a customer issue to a human agent who cannot see the conversation transcript, which items belong in a structured handoff summary? (Select THREE.)",
    options: [
      "The verified customer ID.",
      "Root cause analysis of the issue.",
      "The recommended action and any refund amount.",
      "The model's full token-by-token internal reasoning.",
    ],
    correct: [0, 1, 2],
    exp: "Task 1.4: a structured handoff includes customer details (verified ID), root cause, and the recommended action/amount so a human without the transcript can act. Raw internal reasoning isn't a handoff artifact.",
  },
];

const LETTERS = ["A", "B", "C", "D", "E"];
const arrEq = (a, b) => a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i]);
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/* ---------------------------------------------------------------- Chips */
function DomainChip({ code, small }) {
  return (
    <span
      style={{
        fontFamily: T.mono, fontSize: small ? 10 : 11, letterSpacing: "0.06em",
        color: T.accent, background: T.accentSoft, border: `1px solid ${T.accentLine}`,
        padding: small ? "2px 6px" : "3px 8px", borderRadius: 5, whiteSpace: "nowrap",
        textTransform: "uppercase", fontWeight: 600,
      }}
      title={DOMAINS[code].label}
    >
      {code} · {DOMAINS[code].label}
    </span>
  );
}

function TypePill({ type }) {
  const multi = type === "multi";
  return (
    <span style={{
      fontFamily: T.mono, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase",
      color: multi ? T.amber : T.muted, background: multi ? T.amberSoft : "transparent",
      border: `1px solid ${multi ? "#EAD3A3" : T.line}`, padding: "2px 7px", borderRadius: 5, fontWeight: 600,
    }}>
      {multi ? "Select multiple" : "Single answer"}
    </span>
  );
}

/* ------------------------------------------------------------ Option row */
function Option({ label, text, state, onClick, isMulti, disabled }) {
  // state: "idle" | "selected" | "correct" | "incorrect" | "missed"
  const styles = {
    idle: { border: T.line, bg: T.surface, mark: T.faint, markBg: "transparent" },
    selected: { border: T.accentLine, bg: T.accentSoft, mark: T.accent, markBg: T.accentSoft },
    correct: { border: T.goodLine, bg: T.goodSoft, mark: T.good, markBg: T.goodSoft },
    incorrect: { border: T.badLine, bg: T.badSoft, mark: T.bad, markBg: T.badSoft },
    missed: { border: T.goodLine, bg: "#F1FAF5", mark: T.good, markBg: "transparent" },
  }[state];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex", gap: 12, alignItems: "flex-start", width: "100%", textAlign: "left",
        padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${styles.border}`,
        background: styles.bg, cursor: disabled ? "default" : "pointer",
        transition: "border-color .12s, background .12s", marginBottom: 8,
      }}
    >
      <span style={{
        flex: "0 0 auto", width: 24, height: 24, borderRadius: isMulti ? 6 : "50%",
        border: `1.5px solid ${styles.mark}`, background: styles.markBg, color: styles.mark,
        display: "grid", placeItems: "center", fontFamily: T.mono, fontSize: 12, fontWeight: 700,
        marginTop: 1,
      }}>
        {state === "correct" || state === "missed" ? "✓" : state === "incorrect" ? "✕" : label}
      </span>
      <span style={{ color: T.ink, fontSize: 14.5, lineHeight: 1.5 }}>{text}</span>
    </button>
  );
}

/* ============================================================ Main App */
export default function App() {
  const [view, setView] = useState("practice"); // practice | exam | results
  const [order, setOrder] = useState(() => QUESTIONS.map((q) => q.id));
  const [filter, setFilter] = useState("ALL");
  const [answers, setAnswers] = useState({}); // id -> number[]
  const [checked, setChecked] = useState({}); // id -> bool (practice)
  const [idx, setIdx] = useState(0);

  // exam state
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const timerRef = useRef(null);

  const filteredIds = useMemo(
    () => order.filter((id) => filter === "ALL" || QUESTIONS.find((q) => q.id === id).domain === filter),
    [order, filter]
  );
  const list = view === "exam" ? order : filteredIds;
  const curId = list[Math.min(idx, list.length - 1)];
  const cur = QUESTIONS.find((q) => q.id === curId);

  useEffect(() => { setIdx(0); }, [filter, view]);

  // timer
  useEffect(() => {
    if (view === "exam" && examStarted && !submitted) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) { clearInterval(timerRef.current); doSubmit(); return 0; }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [view, examStarted, submitted]);

  const toggle = (qid, optIdx, isMulti) => {
    if (view === "practice" && checked[qid]) return;
    setAnswers((prev) => {
      const cur = prev[qid] || [];
      if (isMulti) {
        return { ...prev, [qid]: cur.includes(optIdx) ? cur.filter((x) => x !== optIdx) : [...cur, optIdx] };
      }
      return { ...prev, [qid]: [optIdx] };
    });
  };

  const optState = (q, optIdx) => {
    const sel = (answers[q.id] || []).includes(optIdx);
    const isCorrect = q.correct.includes(optIdx);
    const reveal = (view === "practice" && checked[q.id]) || (view === "exam" && submitted);
    if (!reveal) return sel ? "selected" : "idle";
    if (isCorrect && sel) return "correct";
    if (isCorrect && !sel) return "missed";
    if (!isCorrect && sel) return "incorrect";
    return "idle";
  };

  const isRight = (q) => arrEq(answers[q.id] || [], q.correct);

  // practice stats
  const answeredChecked = list.filter((id) => checked[id]);
  const correctCount = answeredChecked.filter((id) => isRight(QUESTIONS.find((q) => q.id === id))).length;

  const startExam = () => {
    setOrder(shuffle(QUESTIONS.map((q) => q.id)));
    setAnswers({}); setChecked({}); setSubmitted(false); setIdx(0);
    setTimeLeft(QUESTIONS.length * 120); // 2 min per question
    setExamStarted(true);
  };
  const doSubmit = () => { setSubmitted(true); setView("results"); if (timerRef.current) clearInterval(timerRef.current); };

  const resetAll = () => {
    setAnswers({}); setChecked({}); setSubmitted(false); setExamStarted(false);
    setIdx(0); setOrder(QUESTIONS.map((q) => q.id)); setFilter("ALL"); setView("practice");
  };

  // results computation
  const results = useMemo(() => {
    const total = QUESTIONS.length;
    const correct = QUESTIONS.filter((q) => arrEq(answers[q.id] || [], q.correct)).length;
    const pct = total ? correct / total : 0;
    const scaled = Math.round(100 + pct * 900);
    const byDomain = {};
    Object.keys(DOMAINS).forEach((d) => {
      const qs = QUESTIONS.filter((q) => q.domain === d);
      const c = qs.filter((q) => arrEq(answers[q.id] || [], q.correct)).length;
      byDomain[d] = { total: qs.length, correct: c, pct: qs.length ? c / qs.length : 0 };
    });
    return { total, correct, pct, scaled, pass: scaled >= 720, byDomain };
  }, [answers]);

  const gridBg = {
    backgroundColor: T.bg,
    backgroundImage: `linear-gradient(${T.grid} 1px, transparent 1px), linear-gradient(90deg, ${T.grid} 1px, transparent 1px)`,
    backgroundSize: "26px 26px",
  };

  return (
    <div style={{ ...gridBg, minHeight: "100vh", fontFamily: T.sans, color: T.ink, padding: "22px 16px 56px" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>

        {/* Header */}
        <header style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, letterSpacing: "0.22em", color: T.accent, textTransform: "uppercase", fontWeight: 600 }}>
            Exam Code · CCAR-F
          </div>
          <h1 style={{ margin: "6px 0 4px", fontSize: 27, lineHeight: 1.12, letterSpacing: "-0.02em", fontWeight: 800 }}>
            Claude Certified Architect
            <span style={{ display: "block", fontWeight: 500, color: T.muted, fontSize: 19, letterSpacing: 0 }}>
              Foundations — Practice Trainer
            </span>
          </h1>
          <p style={{ margin: "8px 0 0", color: T.muted, fontSize: 13.5, lineHeight: 1.55, maxWidth: 640 }}>
            {QUESTIONS.length} scenario items across all five blueprint domains. Practice mode gives instant
            feedback and explanations; exam mode simulates a timed, review-at-the-end run.
          </p>
        </header>

        {/* Mode tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {[["practice", "Practice"], ["exam", "Exam simulation"]].map(([v, lbl]) => {
            const active = view === v || (v === "exam" && view === "results");
            return (
              <button key={v}
                onClick={() => { if (v === "practice") { setView("practice"); setSubmitted(false); } else { setView("exam"); } }}
                style={{
                  fontFamily: T.sans, fontSize: 13.5, fontWeight: 600, padding: "9px 16px", borderRadius: 9,
                  border: `1.5px solid ${active ? T.accent : T.line}`, cursor: "pointer",
                  background: active ? T.accent : T.surface, color: active ? "#fff" : T.ink,
                }}>
                {lbl}
              </button>
            );
          })}
          <div style={{ flex: 1 }} />
          <button onClick={resetAll}
            style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 600, padding: "9px 14px", borderRadius: 9,
              border: `1.5px solid ${T.line}`, background: T.surface, color: T.muted, cursor: "pointer" }}>
            Reset
          </button>
        </div>

        {/* ---------------- PRACTICE ---------------- */}
        {view === "practice" && (
          <>
            {/* filter + shuffle */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontFamily: T.mono, fontSize: 11, color: T.faint, textTransform: "uppercase", letterSpacing: "0.08em" }}>Domain</span>
              {["ALL", ...Object.keys(DOMAINS)].map((d) => {
                const active = filter === d;
                return (
                  <button key={d} onClick={() => setFilter(d)} title={d === "ALL" ? "All domains" : DOMAINS[d].label}
                    style={{ fontFamily: T.mono, fontSize: 11.5, fontWeight: 600, padding: "5px 10px", borderRadius: 7,
                      border: `1.5px solid ${active ? T.accent : T.line}`, background: active ? T.accentSoft : T.surface,
                      color: active ? T.accent : T.muted, cursor: "pointer" }}>
                    {d}
                  </button>
                );
              })}
              <div style={{ flex: 1 }} />
              <button onClick={() => { setOrder(shuffle(QUESTIONS.map((q) => q.id))); setIdx(0); }}
                style={{ fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, padding: "6px 12px", borderRadius: 8,
                  border: `1.5px solid ${T.line}`, background: T.surface, color: T.muted, cursor: "pointer" }}>
                ⤮ Shuffle
              </button>
            </div>

            {/* progress bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 1, height: 6, borderRadius: 4, background: T.line, overflow: "hidden" }}>
                <div style={{ width: `${((idx + 1) / list.length) * 100}%`, height: "100%", background: T.accent, transition: "width .2s" }} />
              </div>
              <span style={{ fontFamily: T.mono, fontSize: 12, color: T.muted }}>
                {String(idx + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")}
              </span>
              <span style={{ fontFamily: T.mono, fontSize: 12, color: T.good, fontWeight: 700 }}>
                {correctCount}/{answeredChecked.length || 0} ✓
              </span>
            </div>

            {cur && <QuestionCard
              q={cur} num={idx + 1}
              answers={answers} optState={optState} toggle={toggle}
              reveal={!!checked[cur.id]} isRight={isRight(cur)}
            />}

            {/* actions */}
            <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
              <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}
                style={navBtn(idx === 0)}>← Previous</button>

              {!checked[cur?.id] ? (
                <button onClick={() => setChecked((c) => ({ ...c, [cur.id]: true }))}
                  disabled={!(answers[cur?.id] || []).length}
                  style={primaryBtn(!(answers[cur?.id] || []).length)}>
                  Check answer
                </button>
              ) : (
                <button onClick={() => setIdx((i) => Math.min(list.length - 1, i + 1))}
                  disabled={idx >= list.length - 1}
                  style={primaryBtn(idx >= list.length - 1)}>
                  Next question →
                </button>
              )}
              <div style={{ flex: 1 }} />
              <button onClick={() => setIdx((i) => Math.min(list.length - 1, i + 1))} disabled={idx >= list.length - 1}
                style={navBtn(idx >= list.length - 1)}>Skip →</button>
            </div>
          </>
        )}

        {/* ---------------- EXAM ---------------- */}
        {view === "exam" && !examStarted && (
          <div style={card()}>
            <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>Exam simulation</h2>
            <p style={{ color: T.muted, fontSize: 14, lineHeight: 1.6, margin: "0 0 14px" }}>
              All {QUESTIONS.length} questions in random order. Timer runs for {QUESTIONS.length * 2} minutes
              (2 min/question, mirroring the real 60-item / 120-minute pace). No feedback until you submit,
              then you get a full score report and answer review.
            </p>
            <ul style={{ color: T.muted, fontSize: 13.5, lineHeight: 1.7, margin: "0 0 16px", paddingLeft: 18 }}>
              <li>Passing standard on the real exam: scaled 720 / 1000.</li>
              <li>The scaled number here is an approximation for practice only.</li>
            </ul>
            <button onClick={startExam} style={primaryBtn(false)}>Start exam</button>
          </div>
        )}

        {view === "exam" && examStarted && !submitted && cur && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{
                fontFamily: T.mono, fontSize: 15, fontWeight: 700,
                color: timeLeft < 120 ? T.bad : T.ink, background: T.surface,
                border: `1.5px solid ${timeLeft < 120 ? T.badLine : T.line}`, padding: "6px 12px", borderRadius: 8,
              }}>
                ⏱ {fmtTime(timeLeft)}
              </div>
              <div style={{ flex: 1, height: 6, borderRadius: 4, background: T.line, overflow: "hidden" }}>
                <div style={{ width: `${((idx + 1) / list.length) * 100}%`, height: "100%", background: T.accent }} />
              </div>
              <span style={{ fontFamily: T.mono, fontSize: 12, color: T.muted }}>
                {idx + 1}/{list.length} · answered {Object.keys(answers).length}
              </span>
            </div>

            <QuestionCard q={cur} num={idx + 1} answers={answers} optState={optState} toggle={toggle} reveal={false} />

            {/* jump grid */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "16px 0" }}>
              {list.map((id, i) => {
                const done = (answers[id] || []).length > 0;
                const here = i === idx;
                return (
                  <button key={id} onClick={() => setIdx(i)}
                    style={{ width: 30, height: 30, borderRadius: 7, fontFamily: T.mono, fontSize: 12, fontWeight: 700, cursor: "pointer",
                      border: `1.5px solid ${here ? T.accent : done ? T.accentLine : T.line}`,
                      background: here ? T.accent : done ? T.accentSoft : T.surface,
                      color: here ? "#fff" : done ? T.accent : T.faint }}>
                    {i + 1}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} style={navBtn(idx === 0)}>← Previous</button>
              <button onClick={() => setIdx((i) => Math.min(list.length - 1, i + 1))} disabled={idx >= list.length - 1} style={navBtn(idx >= list.length - 1)}>Next →</button>
              <div style={{ flex: 1 }} />
              <button onClick={doSubmit} style={{ ...primaryBtn(false), background: T.good, borderColor: T.good }}>
                Submit exam
              </button>
            </div>
          </>
        )}

        {/* ---------------- RESULTS ---------------- */}
        {view === "results" && (
          <>
            <div style={{ ...card(), textAlign: "center", borderColor: results.pass ? T.goodLine : T.badLine }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: T.muted }}>
                Approximate scaled score
              </div>
              <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-0.03em", color: results.pass ? T.good : T.bad, lineHeight: 1.05, margin: "4px 0" }}>
                {results.scaled}
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 13, color: T.muted }}>
                {results.correct} / {results.total} correct · {Math.round(results.pct * 100)}%
              </div>
              <div style={{
                display: "inline-block", marginTop: 12, padding: "6px 16px", borderRadius: 999, fontWeight: 700, fontSize: 14,
                color: results.pass ? T.good : T.bad, background: results.pass ? T.goodSoft : T.badSoft,
                border: `1.5px solid ${results.pass ? T.goodLine : T.badLine}`,
              }}>
                {results.pass ? "PASS (≥ 720)" : "BELOW CUT (720)"}
              </div>
              <div style={{ fontSize: 11.5, color: T.faint, marginTop: 10 }}>
                Practice estimate only — the real exam uses scaled scoring across 60 items.
              </div>
            </div>

            {/* domain breakdown */}
            <div style={{ ...card(), padding: "16px 18px" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 15 }}>Performance by domain</h3>
              {Object.keys(DOMAINS).map((d) => {
                const r = results.byDomain[d];
                const p = Math.round(r.pct * 100);
                return (
                  <div key={d} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                      <span style={{ fontSize: 13, color: T.ink }}>
                        <span style={{ fontFamily: T.mono, fontWeight: 700, color: T.accent }}>{d}</span>{" "}
                        {DOMAINS[d].label} <span style={{ color: T.faint }}>· {DOMAINS[d].weight}% of exam</span>
                      </span>
                      <span style={{ fontFamily: T.mono, fontSize: 12, color: T.muted }}>{r.correct}/{r.total} · {p}%</span>
                    </div>
                    <div style={{ height: 7, borderRadius: 4, background: T.line, overflow: "hidden" }}>
                      <div style={{ width: `${p}%`, height: "100%", background: p >= 70 ? T.good : p >= 50 ? T.amber : T.bad }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* review */}
            <h3 style={{ margin: "20px 0 12px", fontSize: 15 }}>Answer review</h3>
            {order.map((id, i) => {
              const q = QUESTIONS.find((x) => x.id === id);
              return (
                <QuestionCard key={id} q={q} num={i + 1} answers={answers} optState={optState}
                  toggle={() => {}} reveal={true} isRight={isRight(q)} readOnly />
              );
            })}

            <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
              <button onClick={startExam} style={primaryBtn(false)}>Retake exam</button>
              <button onClick={() => { setView("practice"); setSubmitted(false); setChecked({}); }} style={navBtn(false)}>
                Back to practice
              </button>
            </div>
          </>
        )}

        <footer style={{ marginTop: 40, paddingTop: 16, borderTop: `1px solid ${T.line}`, color: T.faint, fontSize: 11.5, lineHeight: 1.6 }}>
          Unofficial study aid. Questions are original, written to the public CCAR-F exam guide blueprint —
          not actual exam items. Verify current product behavior against Anthropic's documentation.
        </footer>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- QuestionCard */
function QuestionCard({ q, num, answers, optState, toggle, reveal, isRight, readOnly }) {
  const isMulti = q.type === "multi";
  return (
    <div style={card()}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
        <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 800, color: T.ink }}>
          Q{String(num).padStart(2, "0")}
        </span>
        <DomainChip code={q.domain} small />
        <TypePill type={q.type} />
        {reveal && (
          <span style={{ marginLeft: "auto", fontFamily: T.mono, fontSize: 12, fontWeight: 700,
            color: isRight ? T.good : T.bad }}>
            {isRight ? "Correct ✓" : "Incorrect ✕"}
          </span>
        )}
      </div>

      <p style={{ fontSize: 15.5, lineHeight: 1.55, margin: "0 0 16px", color: T.ink, fontWeight: 500 }}>{q.q}</p>

      {q.options.map((opt, i) => (
        <Option key={i} label={LETTERS[i]} text={opt} isMulti={isMulti}
          state={optState(q, i)} disabled={readOnly || reveal}
          onClick={() => toggle(q.id, i, isMulti)} />
      ))}

      {reveal && (
        <div style={{ marginTop: 14, padding: "13px 15px", borderRadius: 10, background: "#F6F8FC", border: `1px solid ${T.line}` }}>
          <div style={{ fontFamily: T.mono, fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: T.accent, fontWeight: 700, marginBottom: 6 }}>
            Why — {q.correct.map((c) => LETTERS[c]).join(", ")}
          </div>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: T.muted }}>{q.exp}</p>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- styles */
function card() {
  return { background: T.surface, border: `1.5px solid ${T.line}`, borderRadius: 14, padding: "18px 20px", marginBottom: 14, boxShadow: "0 1px 2px rgba(22,32,46,0.03)" };
}
function primaryBtn(disabled) {
  return { fontFamily: T.sans, fontSize: 14, fontWeight: 700, padding: "10px 20px", borderRadius: 10,
    border: `1.5px solid ${T.accent}`, background: disabled ? "#A9B6D8" : T.accent, borderColor: disabled ? "#A9B6D8" : T.accent,
    color: "#fff", cursor: disabled ? "default" : "pointer" };
}
function navBtn(disabled) {
  return { fontFamily: T.sans, fontSize: 14, fontWeight: 600, padding: "10px 18px", borderRadius: 10,
    border: `1.5px solid ${T.line}`, background: T.surface, color: disabled ? T.faint : T.ink,
    cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.6 : 1 };
}
