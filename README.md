# CCAR-F Practice Trainer

An unofficial study tool for the **Claude Certified Architect — Foundations (CCAR-F)** certification exam. Practice mode gives instant feedback with explanations; exam mode draws a timed 60-question form weighted to the official blueprint.

**Live app:** [ccarf-f-trainig-app.retro-poker.workers.dev](https://ccarf-f-trainig-app.retro-poker.workers.dev/)

> ⚠️ **Disclaimer** — This is an independent, unofficial study aid. It is **not** affiliated with, endorsed by, or sponsored by Anthropic. "Claude" and related marks are trademarks of Anthropic. Questions are original, written to the public CCAR-F exam guide blueprint. They are **not** actual exam items. Always verify current product behavior against [Anthropic's documentation](https://docs.anthropic.com/).

## Features

- **90 scenario-based questions** across all five blueprint domains
- **Anti-guess design** — distractors are length-balanced against the correct answer, and options are reshuffled on every app load
- **Practice mode** — browse questions with domain filtering, instant feedback, and detailed explanations
- **Exam simulation** — 60-question form drawn from the bank, weighted by domain quotas, with a 120-minute countdown timer
- **Score report** — scaled score (100–1000), per-domain breakdown with visual progress bars, and full answer review
- **Mistake tracking** — every wrong answer is stored locally in IndexedDB and reviewable on the `/review-errors` page (per-question miss counts, dates, resolution status)
- **Practice drill timer** — selectable durations (2–60 min) with pause/resume
- **Dark & light themes** — persisted to localStorage
- **Sound feedback** — synthesized audio cues (Web Audio API, no external assets)
- **Zero dependencies beyond React** — no component libraries, no state management packages
- **Local-only data** — no accounts, no analytics, no network requests; all progress stays on your device

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | Inline styles with CSS custom properties (design-token system) |
| Audio | Web Audio API (synthesized tones) |
| Testing | Vitest + React Testing Library (jsdom, fake-indexeddb) |
| Deploy | Cloudflare Workers static assets (`wrangler.jsonc`) — any static host also works |

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test            # once
npm run test:watch  # watch mode

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
├── App.tsx                          # Root component — state management, routing
├── main.tsx                         # Entry point
├── index.html                       # HTML shell
├── src/
│   ├── types.ts                     # Shared TypeScript types
│   ├── components/
│   │   ├── Header.tsx               # Title, subtitle, description
│   │   ├── Toolbar.tsx              # Mode tabs, review-errors link, sound/theme toggles
│   │   ├── PracticeView.tsx         # Practice mode — filters, timer, questions
│   │   ├── ExamIntro.tsx            # Exam start card
│   │   ├── ExamView.tsx             # Exam mode — timer, jump grid, navigation
│   │   ├── ResultsView.tsx          # Score report, domain breakdown, review
│   │   ├── ReviewErrorsView.tsx     # /review-errors — tracked mistakes from IndexedDB
│   │   ├── QuestionCard.tsx         # Question display with options
│   │   ├── Option.tsx               # Individual answer option
│   │   ├── DomainChip.tsx           # Domain badge
│   │   ├── TypePill.tsx             # Single/Multi answer pill
│   │   └── styles.ts               # Shared style factories
│   ├── data/
│   │   ├── questions.ts             # 90-question bank
│   │   └── domains.ts              # Domain config, exam form builder
│   ├── hooks/
│   │   ├── usePracticeTimer.ts      # Practice drill countdown
│   │   └── useExamTimer.ts          # Exam countdown with auto-submit
│   └── lib/
│       ├── utils.ts                 # shuffle, fmtTime, arrEq, LETTERS
│       ├── scoring.ts               # computeResults — scaled score + domain breakdown
│       ├── optionOrder.ts           # Per-session option-order shuffle (defeats memorizing letters)
│       ├── router.ts                # Minimal History-API router (usePath, navigate)
│       ├── mistakeStore.ts          # IndexedDB persistence for wrong answers
│       ├── theme.ts                 # Design tokens + theme CSS
│       └── audio.ts                 # Web Audio API cue synthesizer
└── src/__tests__/
    └── App.test.tsx                 # End-to-end practice & exam flows
```

Tests (Vitest + React Testing Library, jsdom) are colocated with the code they cover as `*.test.ts(x)`; `npm test` runs them all.

## Exam Blueprint

Questions are distributed across five domains matching the official CCAR-F weight:

| Domain | Topic | Weight |
|--------|-------|--------|
| D1 | Agentic Architecture & Orchestration | 27% |
| D2 | Tool Design & MCP Integration | 18% |
| D3 | Claude Code Configuration & Workflows | 20% |
| D4 | Prompt Engineering & Structured Output | 20% |
| D5 | Context Management & Reliability | 15% |

## Deployment

### Cloudflare Workers (static assets)

The site is deployed as [Workers static assets](https://developers.cloudflare.com/workers/static-assets/) — no Worker script needed. Configuration (asset directory, SPA fallback) lives in `wrangler.jsonc`.

```bash
npm run build
npx wrangler deploy
```

### Other static hosts

Works with Cloudflare Pages, Netlify Drop, GitHub Pages, or any static host:

```bash
npm run build
# Upload the dist/ folder
```

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.
