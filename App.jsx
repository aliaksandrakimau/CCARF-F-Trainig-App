import React, { useState, useEffect, useMemo, useRef } from "react";

/* =========================================================================
   Claude Certified Architect – Foundations (CCAR-F) Practice Trainer
   Single-file React artifact. No external libraries, no browser storage.
   ========================================================================= */

const T = {
  bg: "var(--bg)",
  grid: "var(--grid)",
  surface: "var(--surface)",
  ink: "var(--ink)",
  muted: "var(--muted)",
  faint: "var(--faint)",
  line: "var(--line)",
  accent: "var(--accent)",
  accentSoft: "var(--accent-soft)",
  accentLine: "var(--accent-line)",
  amber: "var(--amber)",
  amberSoft: "var(--amber-soft)",
  amberLine: "var(--amber-line)",
  good: "var(--good)",
  goodSoft: "var(--good-soft)",
  goodLine: "var(--good-line)",
  bad: "var(--bad)",
  badSoft: "var(--bad-soft)",
  badLine: "var(--bad-line)",
  missedSoft: "var(--missed-soft)",
  expBg: "var(--exp-bg)",
  btnDisabled: "var(--btn-disabled)",
  onAccent: "var(--on-accent)",
  mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  sans: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
};

const THEME_CSS = `
[data-theme="light"] {
  --bg: #EEF1F6; --grid: rgba(41,75,181,0.05); --surface: #FFFFFF;
  --ink: #16202E; --muted: #5B6B80; --faint: #8A99AD; --line: #D7DEEA;
  --accent: #294BB5; --accent-soft: #E8EDFB; --accent-line: #B9C6EE;
  --amber: #B26A00; --amber-soft: #FBEFD9; --amber-line: #EAD3A3;
  --good: #1F8A5B; --good-soft: #E4F4EC; --good-line: #A7DBC2;
  --bad: #C0392B; --bad-soft: #FBEAE7; --bad-line: #EBB8B0;
  --missed-soft: #F1FAF5; --exp-bg: #F6F8FC; --btn-disabled: #A9B6D8;
  --on-accent: #FFFFFF;
}
[data-theme="dark"] {
  --bg: #0F1522; --grid: rgba(122,150,232,0.06); --surface: #172034;
  --ink: #E8EDF7; --muted: #9AA8BF; --faint: #66748C; --line: #2A3752;
  --accent: #7A96E8; --accent-soft: #212F52; --accent-line: #3D5288;
  --amber: #E0A94F; --amber-soft: #33290F; --amber-line: #5C4A26;
  --good: #4CC38A; --good-soft: #14301F; --good-line: #2C5E45;
  --bad: #E8756A; --bad-soft: #381D1A; --bad-line: #6B3430;
  --missed-soft: #102618; --exp-bg: #131C2E; --btn-disabled: #3A4A6B;
  --on-accent: #0F1522;
}
[data-theme] { color-scheme: light; }
[data-theme="dark"] { color-scheme: dark; }
`;

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

  /* ---------------- D1: Agentic Architecture & Orchestration ---------------- */
  {
    id: 28, domain: "D1", type: "single",
    q: "Your agent loop receives a response with stop_reason \"pause_turn\" while a server-side web search tool is running. What should your code do?",
    options: [
      "Treat it as a failure and retry the original request from scratch.",
      "Send the response back in a follow-up request so the server-side tool loop continues.",
      "Treat it like end_turn and present the partial content to the user.",
      "Increase max_tokens and resubmit the conversation.",
    ],
    correct: [1],
    exp: "Task 1.1: pause_turn means the server-side tool loop hit its iteration cap mid-task. The correct handling is to send the paused response back so the turn continues — not to retry, terminate, or change token limits.",
  },
  {
    id: 29, domain: "D1", type: "single",
    q: "A response arrives with HTTP 200 but stop_reason \"refusal\". Your pipeline currently reads content[0].text and moves on. What is the correct handling?",
    options: [
      "Retry the identical request — refusals are transient.",
      "Branch on stop_reason before reading content; treat refusal as terminal for that request and inspect stop_details (type, category, explanation).",
      "Lower the temperature and resubmit until the model complies.",
      "Catch the HTTP error code and route it to your exception handler.",
    ],
    correct: [1],
    exp: "Tasks 1.1 / 5.8: refusals arrive as HTTP 200 with stop_reason \"refusal\" plus a stop_details object. Code that only reads content treats them as successful empty responses. Refusal is terminal for that request — branch on stop_reason first.",
  },
  {
    id: 30, domain: "D1", type: "single",
    q: "In the Agent SDK, you must choose between a fork and a fresh subagent for a follow-up task that builds directly on a long, expensive analysis already in the conversation. Key trade-off?",
    options: [
      "Forks inherit the whole conversation, system prompt, tools, and a warm prompt cache (cheaper); fresh subagents get only explicitly passed context and a cold cache.",
      "Fresh subagents are always cheaper because they start with less context.",
      "Forks can spawn sub-forks, fresh subagents cannot.",
      "There is no difference — both automatically see the parent history.",
    ],
    correct: [0],
    exp: "Task 1.3: a fork inherits the entire conversation plus the parent's prompt cache, making it the cheap choice for branches off a shared baseline; fresh subagents receive only explicit context with a cold cache. Forks cannot spawn sub-forks.",
  },
  {
    id: 31, domain: "D1", type: "single",
    q: "Claude returns one response containing a text block and three parallel tool_use blocks. Your runner executes the tools but returns each result in its own separate user message. Weeks later Claude has stopped making parallel calls. Why?",
    options: [
      "The model's parallelism quota was exhausted by the earlier calls.",
      "Splitting tool results across multiple messages silently teaches Claude that parallel calls aren't handled — all tool_result blocks must return in a single user message, each referencing its tool_use_id.",
      "Parallel tool use must be re-enabled every 100 requests.",
      "The text block must be removed before returning results.",
    ],
    correct: [1],
    exp: "Tasks 1.1 / 2.5: all tool_result blocks for parallel calls must be returned together in one user message, matched by tool_use_id. Splitting them across messages degrades the model's parallel-calling behavior over time.",
  },
  {
    id: 32, domain: "D1", type: "single",
    q: "In a hub-and-spoke multi-agent research system, the web-search subagent starts sending its findings directly to the synthesis subagent to \"save a hop.\" What is wrong with this?",
    options: [
      "Nothing — direct subagent communication reduces latency and is recommended.",
      "Subagents should never communicate directly; the coordinator must route all inter-subagent communication so it can aggregate, evaluate coverage, and handle errors.",
      "It's fine as long as both subagents share the same model.",
      "It only fails if the subagents use different tool sets.",
    ],
    correct: [1],
    exp: "Task 1.2: in the standard hub-and-spoke pattern the coordinator owns decomposition, routing, aggregation, and error handling. Direct subagent-to-subagent channels bypass coverage evaluation and error handling.",
  },
  {
    id: 33, domain: "D1", type: "single",
    q: "Compliance requires every file-writing tool call to be logged to an external audit service (webhook) before execution, and lint checks to run on files after edits. Which hook types fit each requirement?",
    options: [
      "http hook for the audit webhook; command hook (shell) for post-edit linting.",
      "prompt hooks for both — ask an LLM whether to log and lint.",
      "command hooks for both, curling the webhook from shell.",
      "agent hook for the webhook; mcp_tool hook for linting.",
    ],
    correct: [0],
    exp: "Task 1.5: the hook-type decision rule maps audit logging/webhooks to http hooks and file validation/linting to command hooks. prompt hooks are for context-dependent yes/no approval; agent hooks for complex compliance needing tools.",
  },
  {
    id: 34, domain: "D1", type: "single",
    q: "A document pipeline always performs the same three steps in order: extract entities → cross-reference against a database → generate a summary report. Which orchestration pattern fits?",
    options: [
      "Dynamic adaptive decomposition that discovers subtasks at runtime.",
      "Prompt chaining — a fixed sequential pipeline where each step's output feeds the next.",
      "A judge panel of independent attempts with scoring.",
      "A single mega-prompt performing all three steps at once.",
    ],
    correct: [1],
    exp: "Task 1.6: when the sequence is known upfront and each step feeds the next, prompt chaining is the right pattern. Adaptive decomposition is for open-ended investigation where subtasks emerge from discoveries.",
  },
  {
    id: 35, domain: "D1", type: "single",
    q: "A tool your agent called threw an exception. How should the failure be reported back to Claude?",
    options: [
      "Omit the tool_result for that call so Claude ignores it.",
      "Return a tool_result with is_error: true (referencing the tool_use_id) describing the failure so Claude can attempt recovery.",
      "End the conversation and surface the stack trace to the user.",
      "Return a successful empty result to keep the loop moving.",
    ],
    correct: [1],
    exp: "Task 1.1: failed tool calls must still return a tool_result — flagged with is_error: true and matched to the exact tool_use_id — so the model can recover. Dropping results or faking success are anti-patterns.",
  },
  {
    id: 36, domain: "D1", type: "single",
    q: "You resume yesterday's Claude Code session with --resume after refactoring auth.py by hand overnight. The agent keeps referencing the old implementation. Correct practice?",
    options: [
      "Resumed sessions re-scan the filesystem automatically; wait a few turns.",
      "Explicitly tell the resumed session what changed (\"Since our last session, auth.py now uses JWT tokens...\") — it will not detect file changes on its own.",
      "Run /compact to force a filesystem refresh.",
      "Delete the session and always start fresh after any manual edit.",
    ],
    correct: [1],
    exp: "Task 1.7: a resumed session does not automatically notice file changes made since it last ran — you must state them explicitly. Starting fresh is only preferred when tool results are stale or context has drifted badly.",
  },

  /* ---------------- D2: Tool Design & MCP Integration ---------------- */
  {
    id: 37, domain: "D2", type: "single",
    q: "Your agent has a 200-tool catalog; tool definitions consume tens of thousands of prompt tokens and selection is slow. What is the recommended API-level fix?",
    options: [
      "Split the catalog alphabetically across 40 subagents.",
      "Enable tool search: mark most tools defer_loading: true, keep a hot set of 3–5 frequent tools non-deferred (at least one tool must be non-deferred).",
      "Move all tool descriptions into the system prompt to save tokens.",
      "Truncate every description to under 10 words.",
    ],
    correct: [1],
    exp: "Task 2.3: tool search defers non-essential definitions and loads them on demand, cutting definition tokens (~85%) while preserving prompt caching. At least one tool must have defer_loading: false, and keeping a hot set of 3–5 avoids search overhead on common calls.",
  },
  {
    id: 38, domain: "D2", type: "single",
    q: "A knowledge-base search tool returns {\"results\": []} both when nothing matches AND when the search backend times out. Why is this a problem?",
    options: [
      "Empty arrays waste tokens; return null instead.",
      "It conflates \"no relevant content exists\" with \"the search never executed\" — the agent will confidently tell users \"no results exist\" when the service was simply down. The two cases require opposite responses.",
      "JSON arrays aren't valid tool output; wrap them in an object.",
      "The agent should retry every empty result, so the distinction doesn't matter.",
    ],
    correct: [1],
    exp: "Tasks 2.2 / 5.3: HTTP 200 with an empty array is a valid empty result; a timeout/5xx means the search failed and needs retry or an alternative approach. Silent suppression makes the agent dishonest about what it knows.",
  },
  {
    id: 39, domain: "D2", type: "single",
    q: "You add a remote MCP server to .mcp.json with just {\"url\": \"https://api.example.com/mcp\"} and it silently never appears in the tool list. Most likely cause?",
    options: [
      "Remote servers require WebSocket transport, which isn't supported.",
      "The config is missing \"type\": \"http\" — with a url but no type, Claude Code interprets the entry as stdio and skips it.",
      "The server name must be uppercase.",
      ".mcp.json only supports local stdio servers.",
    ],
    correct: [1],
    exp: "Task 2.4: a known gotcha — a url without an explicit transport type is treated as a malformed stdio entry and skipped silently. Remote servers need \"type\": \"http\" (the only transport supporting OAuth) or sse/ws as appropriate.",
  },
  {
    id: 40, domain: "D2", type: "single",
    q: "After a research loop finishes, you want a final summarization turn where Claude must respond with text only and is guaranteed not to call any more tools — but you don't want to strip the tool definitions from context. Which setting?",
    options: [
      "tool_choice: \"auto\"",
      "tool_choice: \"none\"",
      "tool_choice: \"any\"",
      "Remove the tools array from the request.",
    ],
    correct: [1],
    exp: "Task 2.3: tool_choice \"none\" prevents any tool call while keeping definitions in context (useful for cache stability and reference). Removing the tools array changes the prompt prefix and can invalidate the cache.",
  },
  {
    id: 41, domain: "D2", type: "multi",
    q: "Your MCP tools now return structured errors with an errorCategory field. Which category-to-action mappings are correct? (Select TWO.)",
    options: [
      "transient → retry with exponential backoff.",
      "validation → fix the input and retry with corrected parameters.",
      "validation → retry the identical request up to 5 times.",
      "transient → escalate to a human immediately.",
    ],
    correct: [0, 1],
    exp: "Task 2.2: the four categories map to distinct recoveries — transient errors are retryable with backoff; validation errors mean the input must be corrected (identical retries will fail identically); business and permission errors escalate.",
  },

  /* ---------------- D3: Claude Code Configuration & Workflows ---------------- */
  {
    id: 42, domain: "D3", type: "single",
    q: "You need project-specific context that must NOT be committed (it references internal hostnames), while team conventions stay shared. Where does each go?",
    options: [
      "Both in the root CLAUDE.md — add a comment asking teammates not to read the private part.",
      "Shared conventions in the version-controlled project CLAUDE.md; the private context in .claude.local.md (gitignored).",
      "Everything in ~/.claude/CLAUDE.md so nothing is committed.",
      "The private context in .claude/rules/ with a paths: glob.",
    ],
    correct: [1],
    exp: "Task 3.1: the memory hierarchy is Managed Policy → User → Project → Local → Directory. Project CLAUDE.md is version-controlled and shared; .claude.local.md holds project-specific personal/private context and stays out of git.",
  },
  {
    id: 43, domain: "D3", type: "single",
    q: "A /deploy skill must only ever run when a human explicitly types /deploy — Claude must never trigger it on its own — and it should only be allowed to run git and the deploy script. Which frontmatter combination?",
    options: [
      "context: fork and model: haiku.",
      "disable-model-invocation: true plus allowed-tools restricted to the specific Bash commands (e.g. Bash(git *), Bash(npm run deploy *)).",
      "user-invocable: false plus allowed-tools: all.",
      "paths: [\"scripts/deploy/**\"] plus argument-hint.",
    ],
    correct: [1],
    exp: "Task 3.2: disable-model-invocation: true keeps the skill user-triggered only, and allowed-tools whitelists exactly which tool patterns it may use. context: fork addresses context pollution, not invocation control.",
  },
  {
    id: 44, domain: "D3", type: "single",
    q: "Your nightly CI job running claude -p occasionally spirals: one run made 200+ agentic turns and cost $40. Which flags add guardrails?",
    options: [
      "--max-turns N to cap agentic turns and --max-budget-usd X to stop at a spend threshold.",
      "--effort low and --fallback-model haiku.",
      "--no-session-persistence and --bare.",
      "--output-format text to reduce token usage.",
    ],
    correct: [0],
    exp: "Task 3.6: --max-turns is the hard cap on agentic turns and --max-budget-usd stops the run at an API spend threshold (both print-mode guardrails). The other flags affect quality, startup discovery, or output shape — not runaway cost.",
  },
  {
    id: 45, domain: "D3", type: "single",
    q: "A CI step parses Claude Code's output as JSON, but the model sometimes wraps it in prose and the pipeline breaks. Correct headless setup?",
    options: [
      "Prompt harder: \"Respond ONLY with valid JSON, no other text.\"",
      "Use -p with --output-format json and pass --json-schema to validate the final output structure.",
      "Pipe stdout through a regex that strips non-JSON lines.",
      "Use --output-format stream-json and take the last line.",
    ],
    correct: [1],
    exp: "Task 3.6: in print mode, --output-format json gives structured output and --json-schema validates the result against a JSON Schema — deterministic guarantees instead of prompt hopes or brittle post-processing.",
  },
  {
    id: 46, domain: "D3", type: "single",
    q: "The task: migrate 45 files from one logging library to another, touching shared interfaces. Your teammate starts typing straight into default mode and accepting edits. What's the recommended approach?",
    options: [
      "Continue — plan mode is only for greenfield projects.",
      "Use plan mode first: explore, identify affected files, present the migration plan for approval, then implement.",
      "Run with --permission-mode bypassPermissions to move faster.",
      "Split the work into 45 separate sessions, one per file.",
    ],
    correct: [1],
    exp: "Task 3.4: multi-file changes with architectural scope call for plan mode (explore → plan → approve → implement). Direct execution suits single-file, well-understood fixes; bypassPermissions removes safety rather than adding structure.",
  },
  {
    id: 47, domain: "D3", type: "single",
    q: "Mid-task, you need to answer \"where is rate limiting implemented across this large monorepo?\" without flooding your main session's context with dozens of file reads. Best mechanism?",
    options: [
      "Read every plausible file in the main session and /compact afterwards.",
      "Delegate to the read-only Explore subagent, which searches in an isolated context and returns a concise summary.",
      "Open a second terminal and grep manually.",
      "Ask the model to \"be brief\" while reading files in the main session.",
    ],
    correct: [1],
    exp: "Tasks 3.4 / 5.4: the Explore subagent runs noisy read-only discovery in isolation and returns only the distilled answer, preserving the main conversation's context. Reading in-session then compacting still degrades earlier context.",
  },

  /* ---------------- D4: Prompt Engineering & Structured Output ---------------- */
  {
    id: 48, domain: "D4", type: "single",
    q: "Prose instructions keep failing to disambiguate edge cases in a classification prompt. You decide to add few-shot examples. What does each example need to teach generalization rather than memorization?",
    options: [
      "As many examples as fit the context window — coverage beats quality.",
      "2–4 targeted examples, each containing the input, the correct output, AND the reasoning explaining why that output is correct.",
      "Only inputs and outputs — reasoning wastes tokens.",
      "A single canonical example repeated three times for emphasis.",
    ],
    correct: [1],
    exp: "Task 4.2: the optimal range is 2–4 targeted examples, and each must include reasoning so the model learns the principle, not the surface pattern. Excessive examples cause overfitting and waste context.",
  },
  {
    id: 49, domain: "D4", type: "single",
    q: "You enable strict mode on a tool schema for financial extraction and get a validation error. Which schema requirements does strict mode impose?",
    options: [
      "All property names must be snake_case and under 20 characters.",
      "Every object needs additionalProperties: false and all properties listed in required (with a limited JSON Schema subset).",
      "The schema must contain at least one enum field.",
      "Top-level type must be array, not object.",
    ],
    correct: [1],
    exp: "Tasks 2.1 / 4.3: strict mode guarantees schema conformance but demands additionalProperties: false on every object and all properties present in required, using a restricted JSON Schema subset.",
  },
  {
    id: 50, domain: "D4", type: "single",
    q: "An invoice extractor passes schema validation 100% of the time, yet line-item sums sometimes don't match the extracted total. The team is confused because \"validation passes.\" What's the architectural insight?",
    options: [
      "Schema compliance ≠ semantic correctness: validation checks types and fields, not business logic — extract both the stated total and a computed sum, and flag mismatches in code.",
      "The schema needs more required fields to catch the math errors.",
      "Increase retries until the totals match.",
      "Switch the totals field to a string type so any value is valid.",
    ],
    correct: [0],
    exp: "Tasks 4.3 / 4.4: schema validation catches structural errors only. Semantic checks (totals matching, date logic) need custom code — the calculated-vs-stated pattern flags mismatches deterministically instead of retrying.",
  },
  {
    id: 51, domain: "D4", type: "multi",
    q: "Prompt caching shows near-zero cache_read_input_tokens despite a large stable system prompt. Which of these are known silent cache invalidators? (Select TWO.)",
    options: [
      "A datetime.now() timestamp interpolated into the system prompt.",
      "A tool list whose ordering varies between requests.",
      "Using more than 1024 tokens in the prefix.",
      "Placing the user's question after the last cache breakpoint.",
    ],
    correct: [0, 1],
    exp: "Task 4.8: the cache keys on the exact prefix — per-request timestamps and non-deterministic tool ordering change bytes early in the prefix and invalidate everything after. ≥1024 tokens is required for caching, and volatile content after the last breakpoint is exactly where it belongs.",
  },
  {
    id: 52, domain: "D4", type: "single",
    q: "You're structuring a request for maximum prompt-cache reuse. What ordering rule applies, and how many cache breakpoints can you set?",
    options: [
      "Content renders messages → system → tools; up to 10 breakpoints.",
      "Content renders tools → system → messages; stable content first, volatile last, with a maximum of 4 cache_control breakpoints per request.",
      "Ordering doesn't matter because the cache hashes the whole request; 1 breakpoint.",
      "System prompt always renders first; unlimited breakpoints.",
    ],
    correct: [1],
    exp: "Task 4.8: the render order is tools → system → messages, so tool changes invalidate everything after them. Put frozen content first, volatile content (timestamps, the actual question) after the last of at most 4 ephemeral breakpoints.",
  },
  {
    id: 53, domain: "D4", type: "single",
    q: "An overnight batch of 10,000 extraction requests completes with 200 failures. The engineer resubmits the entire batch \"to be safe.\" What's the correct pattern?",
    options: [
      "Resubmitting everything is correct — batches are atomic.",
      "Identify failed requests by custom_id and resubmit only those; results arrive in any order, so correlation must never rely on position.",
      "Retry the whole batch on the synchronous API for reliability.",
      "Sort the results array by index to line up with the requests.",
    ],
    correct: [1],
    exp: "Task 4.5: batch results return unordered and are correlated via custom_id. Resubmit only the failed ids — resubmitting all 10,000 doubles cost for no benefit.",
  },
  {
    id: 54, domain: "D4", type: "single",
    q: "Claude generates a complex module and you ask it, in the same session, to \"review the code you just wrote for bugs.\" The review misses issues an independent reviewer later catches. Why?",
    options: [
      "The model's review skills degrade after generating code.",
      "Same-session self-review retains the generation reasoning, causing confirmation bias — an independent session without knowledge of why decisions were made reviews more critically.",
      "Reviews require a different model family than generation.",
      "The session ran out of output tokens during the review.",
    ],
    correct: [1],
    exp: "Task 4.6: reviewing in the generation session inherits the same assumptions and reasoning that produced the bugs. Use a separate session/instance for review — and for large PRs, split per-file and cross-file integration passes.",
  },
  {
    id: 55, domain: "D4", type: "single",
    q: "You're rewriting \"use best judgment about severity\" into explicit criteria for an automated triage prompt. What are the three components each criterion needs?",
    options: [
      "A severity number, an owner, and a deadline.",
      "What qualifies, what does NOT qualify, and boundary examples illustrating the edge.",
      "A regex, a threshold, and a fallback.",
      "An example, a counter-example, and a confidence score the model must self-report.",
    ],
    correct: [1],
    exp: "Task 4.1: unambiguous judgment rules define what's in, what's out, and the boundary cases. Self-reported confidence scores are poorly calibrated and don't substitute for explicit criteria.",
  },

  /* ---------------- D5: Context Management & Reliability ---------------- */
  {
    id: 56, domain: "D5", type: "single",
    q: "You aggregate ten research documents into one long prompt and put the most decision-critical finding at position ~50% through the text. The model keeps overlooking it. What phenomenon and fix apply?",
    options: [
      "Token starvation — raise max_tokens.",
      "Lost-in-the-middle: models attend most reliably to the beginning and end of long inputs — move critical findings to the start (or bookend them) and add explicit section headers.",
      "Context contamination — split into ten separate API calls.",
      "The model needs the documents in alphabetical order.",
    ],
    correct: [1],
    exp: "Task 5.1: long-context recall is weakest in the middle. Place key findings first, bookend critical information, and use headers for navigation. Simply adding more context capacity makes the effect worse, not better.",
  },
  {
    id: 57, domain: "D5", type: "single",
    q: "Match the mechanism to the need: (a) an agentic loop drowning in dozens of verbose old tool results, (b) a long research conversation needing narrative continuity, (c) findings that must survive across sessions. Which set is correct?",
    options: [
      "(a) compaction, (b) context editing, (c) bigger context window.",
      "(a) context editing (clear old tool results), (b) compaction (summarize while preserving narrative), (c) the memory tool (persistent files outside the conversation).",
      "(a) memory tool, (b) context editing, (c) compaction.",
      "Any of the three — they are interchangeable.",
    ],
    correct: [1],
    exp: "Task 5.7: the three server-side mechanisms are complementary — context editing deletes stale tool results/thinking, compaction summarizes for continuity, and the memory tool persists findings beyond the conversation. Choosing the wrong one loses either fidelity or continuity.",
  },
  {
    id: 58, domain: "D5", type: "single",
    q: "A customer writes in ALL CAPS with multiple exclamation marks about a simple billing typo the agent can fix in one step. The agent escalates to a human because \"the customer is very angry.\" Evaluate this.",
    options: [
      "Correct — strong sentiment always warrants human handling.",
      "Wrong — sentiment intensity does not correlate with issue complexity; the agent should resolve the simple issue (and escalate only on explicit human requests, policy gaps, or lack of progress).",
      "Wrong — the agent should have run a sentiment-analysis tool first.",
      "Correct — long or emotional conversations are inherently complex.",
    ],
    correct: [1],
    exp: "Task 5.2: sentiment ≠ complexity. Escalation triggers are explicit requests for a human, policy gaps/exceptions, no progress after reasonable attempts, or ambiguous account matches — not caps, exclamation marks, or conversation length.",
  },
  {
    id: 59, domain: "D5", type: "single",
    q: "An extraction system reports \"97% overall accuracy,\" so the team skips human review. Later, totals from handwritten notes turn out to be wrong more than half the time. What review design would have caught this?",
    options: [
      "Trust the aggregate — 97% exceeds the 95% target.",
      "Per-document-type and per-field accuracy reporting plus stratified sampling that reviews high-risk categories at a higher rate.",
      "Review a purely random 1% of all outputs equally.",
      "Ask the model to self-report a confidence score and review only low-confidence outputs, uncalibrated.",
    ],
    correct: [1],
    exp: "Task 5.5: aggregate metrics mask per-type failures (handwritten totals at ~42% inside a 97% average). Break accuracy down by document type and field, sample high-risk strata more heavily, and only trust confidence scores calibrated against a labeled set.",
  },
  {
    id: 60, domain: "D5", type: "single",
    q: "Long analysis runs keep getting cut off mid-sentence at max_tokens. You want the model to finish gracefully within a known output ceiling. What's the right mechanism and why?",
    options: [
      "Keep raising max_tokens until truncation stops.",
      "Use a task budget (output_config.task_budget): unlike max_tokens — a hard ceiling the model cannot see — the budget is visible to the model, which paces and wraps up within it.",
      "Add \"please be concise\" to the system prompt.",
      "Stream the response so truncation doesn't matter.",
    ],
    correct: [1],
    exp: "Tasks 5.8 / 1.1: max_tokens is an invisible hard ceiling — hitting it truncates mid-thought. Task budgets are visible to the model, which paces its work and concludes gracefully at the boundary (minimum 20k tokens).",
  },

  /* ---------------- Wave 3: D1 ---------------- */
  {
    id: 61, domain: "D1", type: "single",
    q: "Asked to research \"the impact of AI on creative industries,\" your coordinator spawns a single subagent focused on visual arts and synthesizes a report from it. The report is polished but the client calls it incomplete. Root cause?",
    options: [
      "The subagent's model tier was too small for creative topics.",
      "Overly narrow decomposition — the coordinator should decompose broadly (visual arts, music, writing, film, design) and run explicit coverage checks before synthesis.",
      "The synthesis prompt lacked a word-count minimum.",
      "One subagent can never produce a complete report; always spawn at least five.",
    ],
    correct: [1],
    exp: "Task 1.2: the classic decomposition failure is covering one slice of a broad topic. The fix is broader initial decomposition plus explicit coverage checks — not model size, length rules, or a magic subagent count.",
  },
  {
    id: 62, domain: "D1", type: "single",
    q: "Your orchestrator agent should be able to delegate ONLY to the \"worker\" and \"researcher\" subagents, never to others defined in the project. How do you express that?",
    options: [
      "List worker and researcher first in .claude/agents/ so they take priority.",
      "Narrow the coordinator's allowed tools to Agent(worker, researcher) instead of granting the unrestricted Agent tool.",
      "Add \"only use worker and researcher\" to the coordinator's system prompt.",
      "Delete the other agent definition files before each run.",
    ],
    correct: [1],
    exp: "Task 1.3: the Agent tool accepts a narrowing syntax — Agent(worker, researcher) — restricting which subagents can be spawned. A prompt instruction is probabilistic; file ordering and deleting definitions are not control mechanisms.",
  },
  {
    id: 63, domain: "D1", type: "single",
    q: "A deeply nested automation stops delegating: a subagent three levels down reports it has no Agent tool available, though its definition lists it. Why?",
    options: [
      "Claude Code caps subagent spawn depth (default 3 levels) and withholds the Agent tool at the depth limit.",
      "The Agent tool is only available to the top-level session.",
      "Subagents must be restarted hourly to refresh their tool list.",
      "The concurrency cap of 20 subagents was reached, which removes the tool.",
    ],
    correct: [0],
    exp: "Task 1.3: spawn depth is capped (CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH, default 3) and the Agent tool is simply withheld at the limit. The concurrency cap (20, CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS) queues work but doesn't strip tools.",
  },
  {
    id: 64, domain: "D1", type: "multi",
    q: "A coordinator passes findings to a fresh synthesis subagent. Which items belong in the structured context it receives? (Select THREE.)",
    options: [
      "Each claim with its supporting evidence excerpt.",
      "The source URL and document name for every claim.",
      "Publication dates so the subagent can judge source freshness and resolve apparent conflicts.",
      "The coordinator's entire raw conversation transcript.",
    ],
    correct: [0, 1, 2],
    exp: "Task 1.3: context passing should be structured — claims, evidence, source URL/document, and dates for source-quality evaluation. Dumping the raw transcript is the anti-pattern: verbose, unstructured, and dilutes attention.",
  },
  {
    id: 65, domain: "D1", type: "single",
    q: "In a stream of interleaved messages from several parallel subagents, your logging layer needs to attribute each message to the subagent invocation that produced it. Which field does this?",
    options: [
      "The session_id header on each event.",
      "The parent_tool_use_id field carried by subagent messages.",
      "The order of arrival — messages arrive grouped per subagent.",
      "A custom \"agent-name:\" prefix you instruct each subagent to emit.",
    ],
    correct: [1],
    exp: "Task 1.3: subagent messages carry parent_tool_use_id, linking them to the Agent tool call that spawned them. Arrival order interleaves under parallelism, and prompt-based prefixes are probabilistic.",
  },
  {
    id: 66, domain: "D1", type: "single",
    q: "The synthesis subagent returns a report, and the coordinator notices it covers pricing but ignores the competitive-landscape findings that another subagent produced. What should the coordinator do?",
    options: [
      "Accept the report — synthesis output is authoritative.",
      "Evaluate the synthesis against expected coverage, identify the gap, and re-delegate with the missing findings explicitly included.",
      "Regenerate the entire pipeline from scratch with a different seed.",
      "Append the missing section itself without involving subagents.",
    ],
    correct: [1],
    exp: "Task 1.2: evaluating synthesis output, identifying gaps, and iterating (re-delegating with explicit context) is a core coordinator responsibility. Blind acceptance and full restarts both waste the work already done.",
  },
  {
    id: 67, domain: "D1", type: "single",
    q: "You write a PreToolUse command hook (shell script) that must block a database-migration tool unless a backup marker file exists. How does the script communicate \"block\" vs \"allow\"?",
    options: [
      "Print \"BLOCK\" or \"ALLOW\" to stdout.",
      "Exit code 0 allows the tool call to proceed; exit code 2 blocks it.",
      "Write a boolean into .claude/settings.json before returning.",
      "Raise any non-zero exit code — they all block equally.",
    ],
    correct: [1],
    exp: "Tasks 1.4 / 1.5: for command hooks, exit 0 passes and exit 2 blocks the tool call — a deterministic gate. Hooks can also emit structured output (permissionDecision: allow/deny/ask with a reason), but exit-code semantics are the shell contract.",
  },
  {
    id: 68, domain: "D1", type: "single",
    q: "A single review pass over a 30-file PR produces inconsistent depth: early files get detailed findings, later files get skimmed, and an interface mismatch between two modules is missed entirely. Recommended architecture?",
    options: [
      "One bigger prompt instructing the model to \"review every file equally thoroughly.\"",
      "Two-pass review: Pass 1 analyzes each file locally (bugs, style, security); Pass 2 examines cross-file integration (data flow, interface mismatches).",
      "Review only the 5 largest files — they contain most bugs statistically.",
      "Raise max_tokens so the single pass can write more.",
    ],
    correct: [1],
    exp: "Tasks 1.6 / 4.6: single-pass review of large PRs suffers attention dilution and misses integration issues. Separate per-file local passes from a dedicated cross-file integration pass, each with purpose-specific prompts.",
  },

  /* ---------------- Wave 3: D2 ---------------- */
  {
    id: 69, domain: "D2", type: "single",
    q: "An MCP server should expose (a) an executable \"create_ticket\" action, (b) a read-only catalog of policy documents Claude can pull in as context, and (c) reusable interaction templates. Which MCP server primitives map to these?",
    options: [
      "(a) Tool, (b) Resource, (c) Prompt.",
      "(a) Prompt, (b) Tool, (c) Resource.",
      "(a) Tool, (b) Sampling, (c) Elicitation.",
      "All three must be Tools — MCP servers expose nothing else.",
    ],
    correct: [0],
    exp: "Task 2.4: MCP servers expose three primitives — Tools (executable actions), Resources (read-only content catalogs), and Prompts (interaction templates). Sampling and Elicitation are client-side primitives (server requesting LLM completion or user input).",
  },
  {
    id: 70, domain: "D2", type: "single",
    q: "An MCP database tool returns a 40,000-token result set and Claude reasons over an incomplete list without realizing it. What happened, and what's the better fix?",
    options: [
      "The API rejected the call — results over 25k tokens return an error.",
      "Claude Code truncates MCP output past a limit (~25k tokens, MAX_MCP_OUTPUT_TOKENS); rather than only raising the limit, make the tool return trimmed, relevant fields or paginated results.",
      "MCP has no output limits; the database returned incomplete data.",
      "The model summarized silently; add \"do not summarize\" to the prompt.",
    ],
    correct: [1],
    exp: "Task 2.4: MCP output warns at ~10k and truncates at ~25k tokens (configurable via MAX_MCP_OUTPUT_TOKENS). The durable fix is tool-side: return only relevant fields or paginate — huge dumps also dilute attention even when they fit.",
  },
  {
    id: 71, domain: "D2", type: "single",
    q: "A remote HTTP MCP server requires an Authorization header with a short-lived token minted by an internal CLI. The team currently pastes fresh tokens into .mcp.json daily. Better configuration?",
    options: [
      "Commit the token — it expires anyway, so the risk is low.",
      "Use headersHelper to run the CLI command that mints the token dynamically at connection time.",
      "Switch the server to stdio transport to avoid headers entirely.",
      "Store the token in CLAUDE.md so Claude can read it when needed.",
    ],
    correct: [1],
    exp: "Task 2.4: headersHelper points at a command that produces headers dynamically — built for short-lived credentials. Committing tokens (even expiring ones) and putting secrets in CLAUDE.md are anti-patterns; transport choice doesn't solve auth.",
  },
  {
    id: 72, domain: "D2", type: "single",
    q: "You give Claude the server-side web fetch tool and ask it to \"crawl our docs site and index every page.\" It fetches the homepage and stops. Why?",
    options: [
      "Web fetch only retrieves URLs already present in the conversation — it is not a crawler and won't discover links on its own initiative beyond what's surfaced.",
      "The fetch tool caps at one call per conversation.",
      "The docs site blocked the request with robots.txt.",
      "Web fetch requires each URL to be whitelisted in the API console.",
    ],
    correct: [0],
    exp: "Tasks 2.5 / 2.6: a documented limitation — web fetch fetches URLs already in context; it isn't a crawler. Crawling needs a purpose-built tool or pipeline that feeds discovered URLs back into the conversation.",
  },
  {
    id: 73, domain: "D2", type: "single",
    q: "Claude tries to Edit a config file but the call fails because the target text appears four times in the file. What is the standard fallback?",
    options: [
      "Retry the Edit with the same arguments — matching is probabilistic.",
      "Read the full file, then Write the entire corrected file (or expand the match string until it's unique).",
      "Delete the duplicate occurrences first so the match becomes unique.",
      "Switch to Bash and patch the file with sed.",
    ],
    correct: [1],
    exp: "Task 2.5: Edit works via unique text matching and fails on ambiguity. The standard fallback is Read → Write the whole file, or make the old_string unique by including surrounding context. Deleting duplicates mutates code semantics.",
  },

  /* ---------------- Wave 3: D3 ---------------- */
  {
    id: 74, domain: "D3", type: "single",
    q: "You need a nightly job that reads log files from a mounted network drive only accessible from your office workstation. Routines, Desktop scheduled tasks, or /loop?",
    options: [
      "A Routine — cloud scheduling is the most reliable.",
      "A Desktop scheduled task — it runs locally with file/network access to that machine (which must be on); Routines execute in the cloud without local filesystem access, and /loop only lives inside a running session.",
      "/loop with a 24h interval in a terminal you keep open.",
      "Any of the three — they differ only in UI.",
    ],
    correct: [1],
    exp: "Task 3.0: the three scheduling mechanisms differ by where they execute. Cloud Routines can't reach a local network drive; /loop dies with the session. Local resources on a schedule → Desktop scheduled tasks.",
  },
  {
    id: 75, domain: "D3", type: "single",
    q: "Your CLAUDE.md uses @imports: it imports standards.md, which imports api.md → db.md → naming.md → legacy.md → extra.md. Content from extra.md never loads. Why?",
    options: [
      "@imports only work one level deep.",
      "Import resolution has a maximum depth of 5 hops (circular-import protection) — extra.md is the sixth.",
      "Files imported via @~/ don't support nested imports.",
      "extra.md must be listed in .claude/settings.json to load.",
    ],
    correct: [1],
    exp: "Task 3.1: @import chains resolve to a maximum depth of 5, which also prevents circular imports. Deeper content must be flattened or imported closer to the root file.",
  },
  {
    id: 76, domain: "D3", type: "single",
    q: "Auto Memory keeps \"forgetting\" details your sessions saved: MEMORY.md has grown to 600 lines and older entries never appear in context. What's the actual behavior and the right structure?",
    options: [
      "Auto Memory is capped at 50 entries; delete old ones.",
      "Only the first 200 lines (or 25 KB) of MEMORY.md load each session — keep MEMORY.md as a compact index of one-line pointers and move details into topic files alongside it, which load on demand.",
      "Memory files load fully but are summarized; add \"do not summarize\".",
      "Each worktree has its own memory, so entries are scattered.",
    ],
    correct: [1],
    exp: "Task 3.1: MEMORY.md loads only its first 200 lines / 25 KB; topic files next to it are not subject to that cap and load on demand. Worktrees of the same repo share one memory directory, so scattering isn't the cause.",
  },
  {
    id: 77, domain: "D3", type: "single",
    q: "A skill body contains the line: \"Current branch state: !`git status --short`\". What does this syntax do?",
    options: [
      "Renders a code block the model may choose to execute later.",
      "Executes the shell command when the skill is invoked and injects its output into the skill body BEFORE it is sent to the model.",
      "Registers git status as an allowed tool for the skill.",
      "Nothing — backtick expressions are only valid in frontmatter.",
    ],
    correct: [1],
    exp: "Task 3.2: the !`cmd` syntax is dynamic context injection — the command runs at invocation time and its output is substituted into the skill body before the model sees it, giving the skill fresh data deterministically.",
  },
  {
    id: 78, domain: "D3", type: "single",
    q: "CI runs of claude -p behave differently on different runners because developers' user-level settings and personal skills leak into the run. Which flag makes runs reproducible?",
    options: [
      "--setting-sources with an explicit list (e.g. project only), restricting which settings layers load.",
      "--effort low to reduce variance.",
      "--fork-session to isolate each run.",
      "--output-format json so settings can't affect output.",
    ],
    correct: [0],
    exp: "Task 3.6: --setting-sources restricts which configuration layers (user, project, local) are loaded, so CI behavior doesn't depend on whoever's machine or image runs it. --bare goes further, skipping all auto-discovery.",
  },
  {
    id: 79, domain: "D3", type: "single",
    q: "A headless pipeline needs some tool calls approved by an external policy service at runtime — but there's no human at a terminal to answer permission prompts. What's the designed mechanism?",
    options: [
      "--permission-mode bypassPermissions, since nobody can answer prompts anyway.",
      "--permission-prompt-tool <mcp-tool>, delegating permission decisions to an MCP tool that implements the policy.",
      "Pre-answer prompts by piping \"y\" into stdin.",
      "Wrap every tool in a try/catch and ignore denials.",
    ],
    correct: [1],
    exp: "Task 3.6: --permission-prompt-tool routes headless permission prompts to an MCP tool that decides programmatically. bypassPermissions removes the control entirely rather than delegating it — the opposite of a policy gate.",
  },

  /* ---------------- Wave 3: D4 ---------------- */
  {
    id: 80, domain: "D4", type: "single",
    q: "After migrating an extraction service from Opus 4.6 to Opus 5, requests fail with HTTP 400. The request sets temperature: 0.3 and thinking: {type: \"enabled\", budget_tokens: 8000}. What changed?",
    options: [
      "Opus 5 requires temperature above 0.5.",
      "On the newest models temperature/top_p/top_k and budget_tokens return 400 — adaptive thinking is default on Opus 5, and output depth is controlled via output_config.effort instead.",
      "budget_tokens must now exceed 20,000.",
      "thinking must be declared before temperature in the JSON body.",
    ],
    correct: [1],
    exp: "Task 4.7: the 4.6→5 migration removes sampling knobs (temperature/top_p/top_k → 400) and fixed thinking budgets (budget_tokens → 400). Opus 5 enables adaptive thinking by default; use output_config.effort to control depth.",
  },
  {
    id: 81, domain: "D4", type: "single",
    q: "Legacy code prefilled the assistant message with \"{\" to force JSON output. On current models the request returns 400. Correct replacement?",
    options: [
      "Prefill with \"```json\" instead of \"{\".",
      "Use structured outputs — output_config.format or a forced tool call with a schema — instead of assistant prefills, which are no longer accepted.",
      "Move the \"{\" into the system prompt's last line.",
      "Set stop_sequences to [\"}\"] so the model stays inside JSON.",
    ],
    correct: [1],
    exp: "Task 4.7: assistant-message prefills return 400 on current models. The supported mechanisms for guaranteed structure are output_config.format and tool-based structured output (tool_choice with an input_schema).",
  },
  {
    id: 82, domain: "D4", type: "single",
    q: "A classification field uses enum: [\"invoice\", \"receipt\", \"contract\"]. On ambiguous documents the model confidently picks one anyway, corrupting downstream stats. Schema-level fix?",
    options: [
      "Remove the enum so the model can write free text.",
      "Add an \"unclear\"/\"other\" enum option (and make genuinely optional fields nullable) so the model has a legitimate escape instead of being forced to guess.",
      "Ask for a confidence score in a comment field and filter later.",
      "Lower effort so the model guesses less confidently.",
    ],
    correct: [1],
    exp: "Task 4.3: a closed enum with no escape hatch forces fabrication on ambiguous input. Adding \"unclear\"/\"other\" options and nullable fields lets the model tell the truth; self-reported confidence is poorly calibrated.",
  },
  {
    id: 83, domain: "D4", type: "single",
    q: "Before a burst of traffic hits, you want your large stable prompt prefix already cached so the first real user request gets a cache hit. How can you pre-warm the cache without generating output?",
    options: [
      "Send the request once with max_tokens: 0 — the prefix is processed and cached, and nothing is generated.",
      "Send \"warmup\" as a user message ten times.",
      "Set cache_control: {\"type\": \"persistent\"} to skip warming.",
      "Caching cannot be pre-warmed; the first user always pays full price.",
    ],
    correct: [0],
    exp: "Task 4.8: a max_tokens: 0 request processes and caches the prefix without generation — the documented pre-warm technique. There is no \"persistent\" cache type, and repeated junk messages change the prefix.",
  },
  {
    id: 84, domain: "D4", type: "single",
    q: "You enable tool search with most tools deferred and try to put a cache_control breakpoint on one of the deferred tool definitions. It fails. Why, and what's the fix?",
    options: [
      "Deferred tools are excluded from the system-prompt prefix, so they cannot carry cache_control — place the breakpoint on a non-deferred (hot) tool instead.",
      "cache_control is incompatible with tool search entirely; disable one of them.",
      "Breakpoints on tools require strict mode.",
      "The breakpoint must use type \"permanent\" for deferred tools.",
    ],
    correct: [0],
    exp: "Task 4.8: defer_loading keeps a tool out of the cached prefix, which is exactly why it preserves the cache — and why it can't host a breakpoint. Put the breakpoint on a non-deferred tool; tool search otherwise composes fine with caching.",
  },
  {
    id: 85, domain: "D4", type: "multi",
    q: "Which statements about the Message Batches API are TRUE? (Select TWO.)",
    options: [
      "A single batch request cannot contain a multi-turn conversation exchange that depends on intermediate model replies.",
      "There is no latency SLA — processing can take up to 24 hours.",
      "Results are returned in submission order.",
      "Batch offers a 10% discount versus the synchronous API.",
    ],
    correct: [0, 1],
    exp: "Task 4.5: batch trades latency for a 50% (not 10%) discount, with up to a 24-hour window and no SLA; multi-turn exchanges within one batch request aren't supported. Results arrive in ANY order — correlate by custom_id.",
  },

  /* ---------------- Wave 3: D5 ---------------- */
  {
    id: 86, domain: "D5", type: "single",
    q: "During a 3-hour codebase audit session, automatic compaction fires and the agent loses the exact entry-point locations and JWT expiry values it discovered an hour ago, re-deriving them wrongly. Prevention?",
    options: [
      "Disable compaction and buy a bigger context window.",
      "Persist findings as they're made into a scratchpad file (file:line entry points, tech choices, known issues) — files survive compression and get re-read — and run /compact proactively at natural breakpoints.",
      "Tell the model to \"remember carefully\" before compaction.",
      "Restart the session every 30 minutes to keep context fresh.",
    ],
    correct: [1],
    exp: "Task 5.4: findings must out-live context compression — a scratchpad file persists exact values (and CLAUDE.md/MEMORY.md are re-read from disk). Proactive /compact at controlled moments beats unpredictable automatic degradation.",
  },
  {
    id: 87, domain: "D5", type: "single",
    q: "You adopt server-side compaction (beta) in an API loop. After the first compaction event the conversation state corrupts. Your history-append code does messages.append({role: \"assistant\", content: response.content[0].text}). What's wrong?",
    options: [
      "Assistant turns must be appended with role \"model\".",
      "You must append the ENTIRE response.content array — compaction blocks inside it are what the API uses to replace earlier history; keeping only the text destroys the compaction state silently.",
      "Compaction requires clearing the messages array after every response.",
      "The text must be re-encoded as a tool_result block.",
    ],
    correct: [1],
    exp: "Task 5.7: with compaction, response.content carries special blocks that represent the summarized history. Appending only content[0].text drops them, silently corrupting state. Always append the full content array.",
  },
  {
    id: 88, domain: "D5", type: "single",
    q: "You configure context editing to clear old tool results in a long agentic loop, but the loop relies on earlier web_search results remaining verbatim. How do you protect them?",
    options: [
      "List web_search in exclude_tools within the clear_tool_uses edit so its results are never cleared.",
      "Lower the trigger threshold so clearing happens more often.",
      "Switch web_search results to the assistant role.",
      "You can't — context editing is all-or-nothing per conversation.",
    ],
    correct: [0],
    exp: "Task 5.7: clear_tool_uses_20250919 supports exclude_tools to shield specific tools' results from clearing (plus keep counts and clear_at_least to protect the cache). Editing is configurable per tool, not all-or-nothing.",
  },
  {
    id: 89, domain: "D5", type: "single",
    q: "A support agent looks up \"John Smith\" and finds three matching customer accounts. The conversation is urgent. What should the agent do?",
    options: [
      "Pick the account with the most recent activity — statistically the caller.",
      "Ask the customer for a disambiguating detail (email on file, phone last-4) before acting — never guess between multiple matches, however urgent.",
      "Apply the requested change to all three accounts to be safe.",
      "Escalate immediately — multiple matches always require a human.",
    ],
    correct: [1],
    exp: "Task 5.2: multiple matching accounts require explicit disambiguation, never heuristic guessing (acting on the wrong account is far worse than one extra question). It's a clarifying question, not an automatic escalation.",
  },
  {
    id: 90, domain: "D5", type: "single",
    q: "In a research synthesis, one market-size figure comes from a single blog post while another finding is corroborated by four independent primary sources. The draft presents both with identical confidence. Fix?",
    options: [
      "Drop all single-source claims from the report.",
      "Label certainty levels explicitly — \"well-established\" (multiple sources), \"contested\" (conflicting estimates), \"single-source\" (one report) — and preserve the sources' own caveats rather than reinterpreting claims.",
      "Average the numbers so no single source dominates.",
      "Present only the four-source finding and cite the blog silently.",
    ],
    correct: [1],
    exp: "Task 5.6: single-source and multi-source claims require different treatment — labeled certainty tiers with preserved caveats. Dropping, averaging, or silently merging all discard provenance information the reader needs.",
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

/* ------------------------------------------------- practice feedback cues */
/* Tones are synthesized on the fly — no audio assets, no network requests. */
let audioCtx = null;
const getAudioCtx = () => {
  const Ctx = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
};

const playTone = (ctx, freq, at, dur, peak) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, at);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(at);
  osc.stop(at + dur + 0.02);
};

/* Each cue is a list of [frequency, offset, duration, peak gain]. */
const CUES = {
  correct: [[659.25, 0, 0.13, 0.13], [987.77, 0.09, 0.2, 0.11]],        // E5→B5, rising
  wrong: [[233.08, 0, 0.18, 0.12], [174.61, 0.11, 0.26, 0.1]],          // Bb3→F3, falling
  start: [[523.25, 0, 0.11, 0.1], [783.99, 0.1, 0.22, 0.1]],            // C5→G5, "go"
  end: [[880, 0, 0.16, 0.11], [880, 0.2, 0.16, 0.11], [587.33, 0.4, 0.5, 0.12]], // alarm, then settle
};

const playCue = (name) => {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  (CUES[name] || []).forEach(([f, off, dur, peak]) => playTone(ctx, f, t + off, dur, peak));
};

/* Real exam form: 60 items in 120 minutes, blueprint-weighted regardless of bank size. */
const EXAM_SIZE = 60;
const EXAM_MINUTES = 120;
const EXAM_QUOTAS = { D1: 16, D2: 11, D3: 12, D4: 12, D5: 9 };

// Draws a fresh blueprint-weighted form from the full bank; each sitting differs.
const buildExamForm = () => {
  const picked = [];
  const spare = [];
  Object.keys(DOMAINS).forEach((d) => {
    const pool = shuffle(QUESTIONS.filter((q) => q.domain === d).map((q) => q.id));
    picked.push(...pool.slice(0, EXAM_QUOTAS[d]));
    spare.push(...pool.slice(EXAM_QUOTAS[d]));
  });
  if (picked.length < EXAM_SIZE) picked.push(...shuffle(spare).slice(0, EXAM_SIZE - picked.length));
  return shuffle(picked).slice(0, EXAM_SIZE);
};

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
      border: `1px solid ${multi ? T.amberLine : T.line}`, padding: "2px 7px", borderRadius: 5, fontWeight: 600,
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
    missed: { border: T.goodLine, bg: T.missedSoft, mark: T.good, markBg: "transparent" },
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
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("ccarf-theme") || "dark"; } catch { return "dark"; }
  });
  useEffect(() => {
    try { localStorage.setItem("ccarf-theme", theme); } catch { /* storage unavailable */ }
    document.body.style.background = theme === "dark" ? "#0F1522" : "#EEF1F6";
  }, [theme]);

  const [sound, setSound] = useState(() => {
    try { return localStorage.getItem("ccarf-sound") !== "off"; } catch { return true; }
  });
  useEffect(() => {
    try { localStorage.setItem("ccarf-sound", sound ? "on" : "off"); } catch { /* storage unavailable */ }
  }, [sound]);

  const [view, setView] = useState("practice"); // practice | exam | results
  const [order, setOrder] = useState(() => QUESTIONS.map((q) => q.id));
  const [filter, setFilter] = useState("ALL");
  const [answers, setAnswers] = useState({}); // practice: id -> number[]
  const [checked, setChecked] = useState({}); // id -> bool (practice)
  const [idx, setIdx] = useState(0);

  // practice timer — self-paced, opt-in, with an audible start and finish
  const [drillMins, setDrillMins] = useState(20);
  const [drillLeft, setDrillLeft] = useState(0);
  const [drillRunning, setDrillRunning] = useState(false);
  const [drillDone, setDrillDone] = useState(false);

  // exam state — the exam form and its answers are independent of practice
  const [examIds, setExamIds] = useState([]);
  const [examAnswers, setExamAnswers] = useState({});
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const timerRef = useRef(null);

  const filteredIds = useMemo(
    () => order.filter((id) => filter === "ALL" || QUESTIONS.find((q) => q.id === id).domain === filter),
    [order, filter]
  );
  const inExam = view === "exam" || view === "results";
  const list = inExam ? examIds : filteredIds;
  const ans = inExam ? examAnswers : answers;
  const curId = list[Math.min(idx, list.length - 1)];
  const cur = QUESTIONS.find((q) => q.id === curId);

  useEffect(() => { setIdx(0); }, [filter, view]);

  // timer — keeps running even if you tab over to practice mid-sitting
  useEffect(() => {
    if (examStarted && !submitted) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) { clearInterval(timerRef.current); doSubmit(); return 0; }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [examStarted, submitted]);

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
  const stopDrill = () => { setDrillRunning(false); setDrillLeft(0); setDrillDone(false); };

  const toggle = (qid, optIdx, isMulti) => {
    if (view === "practice" && checked[qid]) return;
    const setter = inExam ? setExamAnswers : setAnswers;
    setter((prev) => {
      const cur = prev[qid] || [];
      if (isMulti) {
        return { ...prev, [qid]: cur.includes(optIdx) ? cur.filter((x) => x !== optIdx) : [...cur, optIdx] };
      }
      return { ...prev, [qid]: [optIdx] };
    });
  };

  const optState = (q, optIdx) => {
    const sel = (ans[q.id] || []).includes(optIdx);
    const isCorrect = q.correct.includes(optIdx);
    const reveal = (view === "practice" && checked[q.id]) || (inExam && submitted);
    if (!reveal) return sel ? "selected" : "idle";
    if (isCorrect && sel) return "correct";
    if (isCorrect && !sel) return "missed";
    if (!isCorrect && sel) return "incorrect";
    return "idle";
  };

  const isRight = (q) => arrEq(ans[q.id] || [], q.correct);

  // practice stats
  const answeredChecked = list.filter((id) => checked[id]);
  const correctCount = answeredChecked.filter((id) => isRight(QUESTIONS.find((q) => q.id === id))).length;

  const startExam = () => {
    stopDrill(); // the exam brings its own clock
    setExamIds(buildExamForm());
    setExamAnswers({}); setSubmitted(false); setIdx(0);
    setTimeLeft(EXAM_MINUTES * 60);
    setView("exam");
    setExamStarted(true);
  };
  const doSubmit = () => { setSubmitted(true); setView("results"); if (timerRef.current) clearInterval(timerRef.current); };

  const resetAll = () => {
    setAnswers({}); setChecked({}); setSubmitted(false); setExamStarted(false);
    setExamIds([]); setExamAnswers({});
    setDrillRunning(false); setDrillLeft(0); setDrillDone(false);
    setIdx(0); setOrder(QUESTIONS.map((q) => q.id)); setFilter("ALL"); setView("practice");
  };

  // results computation
  const results = useMemo(() => {
    const form = examIds.map((id) => QUESTIONS.find((q) => q.id === id)).filter(Boolean);
    const total = form.length;
    const correct = form.filter((q) => arrEq(examAnswers[q.id] || [], q.correct)).length;
    const pct = total ? correct / total : 0;
    const scaled = Math.round(100 + pct * 900);
    const byDomain = {};
    Object.keys(DOMAINS).forEach((d) => {
      const qs = form.filter((q) => q.domain === d);
      const c = qs.filter((q) => arrEq(examAnswers[q.id] || [], q.correct)).length;
      byDomain[d] = { total: qs.length, correct: c, pct: qs.length ? c / qs.length : 0 };
    });
    return { total, correct, pct, scaled, pass: scaled >= 720, byDomain };
  }, [examAnswers, examIds]);

  const gridBg = {
    backgroundColor: T.bg,
    backgroundImage: `linear-gradient(${T.grid} 1px, transparent 1px), linear-gradient(90deg, ${T.grid} 1px, transparent 1px)`,
    backgroundSize: "26px 26px",
  };

  return (
    <div data-theme={theme} style={{ ...gridBg, minHeight: "100vh", fontFamily: T.sans, color: T.ink, padding: "22px 16px 56px" }}>
      <style>{THEME_CSS}</style>
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
            feedback and explanations; exam mode draws a fresh {EXAM_SIZE}-item form and runs the real{" "}
            {EXAM_MINUTES}-minute clock.
          </p>
        </header>

        {/* Mode tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {[["practice", "Practice"], ["exam", "Exam simulation"]].map(([v, lbl]) => {
            const active = view === v || (v === "exam" && view === "results");
            return (
              <button key={v}
                onClick={() => setView(v === "practice" ? "practice" : submitted ? "results" : "exam")}
                style={{
                  fontFamily: T.sans, fontSize: 13.5, fontWeight: 600, padding: "9px 16px", borderRadius: 9,
                  border: `1.5px solid ${active ? T.accent : T.line}`, cursor: "pointer",
                  background: active ? T.accent : T.surface, color: active ? T.onAccent : T.ink,
                }}>
                {lbl}
              </button>
            );
          })}
          <div style={{ flex: 1 }} />
          <button onClick={() => { const on = !sound; setSound(on); if (on) playCue("correct"); }}
            title={sound ? "Mute answer feedback sounds" : "Play a sound on each checked answer"}
            style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 600, padding: "9px 14px", borderRadius: 9,
              border: `1.5px solid ${T.line}`, background: T.surface, color: sound ? T.accent : T.faint, cursor: "pointer" }}>
            {sound ? "♪ Sound" : "♪̸ Muted"}
          </button>
          <button onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 600, padding: "9px 14px", borderRadius: 9,
              border: `1.5px solid ${T.line}`, background: T.surface, color: T.muted, cursor: "pointer" }}>
            {theme === "dark" ? "☀ Light" : "☾ Dark"}
          </button>
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

            {/* practice timer */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontFamily: T.mono, fontSize: 11, color: T.faint, textTransform: "uppercase", letterSpacing: "0.08em" }}>Timer</span>
              {[2, 5, 10, 20, 30, 60].map((m) => {
                const active = drillMins === m;
                return (
                  <button key={m} onClick={() => setDrillMins(m)} disabled={drillRunning}
                    title={drillRunning ? "Stop the timer to change its length"
                      : m === 2 ? "2 minutes — the real exam's per-question pace" : `${m}-minute drill`}
                    style={{ fontFamily: T.mono, fontSize: 11.5, fontWeight: 600, padding: "5px 10px", borderRadius: 7,
                      border: `1.5px solid ${active ? T.accent : T.line}`, background: active ? T.accentSoft : T.surface,
                      color: active ? T.accent : T.muted, cursor: drillRunning ? "default" : "pointer",
                      opacity: drillRunning && !active ? 0.5 : 1 }}>
                    {m}m
                  </button>
                );
              })}

              {(drillRunning || drillLeft > 0 || drillDone) && (
                <span style={{
                  fontFamily: T.mono, fontSize: 14, fontWeight: 700, padding: "5px 11px", borderRadius: 8,
                  color: drillDone || drillLeft < 60 ? T.bad : T.ink, background: T.surface,
                  border: `1.5px solid ${drillDone || drillLeft < 60 ? T.badLine : T.line}`,
                }}>
                  ⏱ {drillDone ? "Time's up" : fmtTime(drillLeft)}
                </span>
              )}

              <div style={{ flex: 1 }} />

              {drillRunning && (
                <button onClick={() => setDrillRunning(false)}
                  style={{ fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, padding: "6px 12px", borderRadius: 8,
                    border: `1.5px solid ${T.line}`, background: T.surface, color: T.muted, cursor: "pointer" }}>
                  ⏸ Pause
                </button>
              )}
              {!drillRunning && drillLeft > 0 && !drillDone && (
                <button onClick={() => setDrillRunning(true)}
                  style={{ fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, padding: "6px 12px", borderRadius: 8,
                    border: `1.5px solid ${T.accentLine}`, background: T.accentSoft, color: T.accent, cursor: "pointer" }}>
                  ▶ Resume
                </button>
              )}
              <button onClick={drillRunning || drillLeft > 0 || drillDone ? stopDrill : startDrill}
                style={{ fontFamily: T.sans, fontSize: 12.5, fontWeight: 600, padding: "6px 12px", borderRadius: 8,
                  border: `1.5px solid ${drillRunning || drillLeft > 0 || drillDone ? T.line : T.accent}`,
                  background: drillRunning || drillLeft > 0 || drillDone ? T.surface : T.accent,
                  color: drillRunning || drillLeft > 0 || drillDone ? T.muted : T.onAccent, cursor: "pointer" }}>
                {drillRunning || drillLeft > 0 || drillDone ? "■ Stop" : `▶ Start ${drillMins}m`}
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
                <button onClick={() => {
                    setChecked((c) => ({ ...c, [cur.id]: true }));
                    if (sound) playCue(isRight(cur) ? "correct" : "wrong");
                  }}
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
              A fresh {EXAM_SIZE}-question form is drawn from the {QUESTIONS.length}-item bank each time, weighted
              to the blueprint ({Object.keys(DOMAINS).map((d) => `${d} ${EXAM_QUOTAS[d]}`).join(" · ")}) and
              shuffled. The clock runs {EXAM_MINUTES} minutes, exactly like the real exam. No feedback until you
              submit, then you get a full score report and answer review.
            </p>
            <ul style={{ color: T.muted, fontSize: 13.5, lineHeight: 1.7, margin: "0 0 16px", paddingLeft: 18 }}>
              <li>Passing standard on the real exam: scaled 720 / 1000.</li>
              <li>The scaled number here is an approximation for practice only.</li>
              <li>Practice-mode filters and shuffling never affect the exam form.</li>
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
                {idx + 1}/{list.length} · answered {Object.keys(examAnswers).length}
              </span>
            </div>

            <QuestionCard q={cur} num={idx + 1} answers={examAnswers} optState={optState} toggle={toggle} reveal={false} />

            {/* jump grid */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "16px 0" }}>
              {list.map((id, i) => {
                const done = (examAnswers[id] || []).length > 0;
                const here = i === idx;
                return (
                  <button key={id} onClick={() => setIdx(i)}
                    style={{ width: 30, height: 30, borderRadius: 7, fontFamily: T.mono, fontSize: 12, fontWeight: 700, cursor: "pointer",
                      border: `1.5px solid ${here ? T.accent : done ? T.accentLine : T.line}`,
                      background: here ? T.accent : done ? T.accentSoft : T.surface,
                      color: here ? T.onAccent : done ? T.accent : T.faint }}>
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
            {examIds.map((id, i) => {
              const q = QUESTIONS.find((x) => x.id === id);
              return (
                <QuestionCard key={id} q={q} num={i + 1} answers={examAnswers} optState={optState}
                  toggle={() => {}} reveal={true} isRight={isRight(q)} readOnly />
              );
            })}

            <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
              <button onClick={startExam} style={primaryBtn(false)}>Retake exam</button>
              <button onClick={() => setView("practice")} style={navBtn(false)}>
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
        <div style={{ marginTop: 14, padding: "13px 15px", borderRadius: 10, background: T.expBg, border: `1px solid ${T.line}` }}>
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
    border: `1.5px solid ${T.accent}`, background: disabled ? T.btnDisabled : T.accent, borderColor: disabled ? T.btnDisabled : T.accent,
    color: T.onAccent, cursor: disabled ? "default" : "pointer" };
}

function navBtn(disabled) {
  return { fontFamily: T.sans, fontSize: 14, fontWeight: 600, padding: "10px 18px", borderRadius: 10,
    border: `1.5px solid ${T.line}`, background: T.surface, color: disabled ? T.faint : T.ink,
    cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.6 : 1 };
}
