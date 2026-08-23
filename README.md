# CCAR-F Practice Trainer

An unofficial study tool for the **Claude Certified Architect — Foundations (CCAR-F)** certification exam. Practice mode gives instant feedback with explanations; exam mode draws a timed 60-question form weighted to the official blueprint.

> ⚠️ **Disclaimer** — This is an independent, unofficial study aid. Questions are original, written to the public CCAR-F exam guide blueprint. They are **not** actual exam items. Always verify current product behavior against [Anthropic's documentation](https://docs.anthropic.com/).

## Features

- **90 scenario-based questions** across all five blueprint domains
- **Practice mode** — browse questions with domain filtering, instant feedback, and detailed explanations
- **Exam simulation** — 60-question form drawn from the bank, weighted by domain quotas, with a 120-minute countdown timer
- **Score report** — scaled score (100–1000), per-domain breakdown with visual progress bars, and full answer review
- **Mistake tracking** — every wrong answer is stored locally in IndexedDB and reviewable on the `/review-errors` page (per-question miss counts, dates, resolution status)
- **Practice drill timer** — selectable durations (2–60 min) with pause/resume
- **Dark & light themes** — persisted to localStorage
- **Sound feedback** — synthesized audio cues (Web Audio API, no external assets)
- **Zero dependencies beyond React** — no component libraries, no state management packages

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | Inline styles with CSS custom properties (design-token system) |
| Audio | Web Audio API (synthesized tones) |
| Deploy | Static — works with Cloudflare Pages, Netlify, GitHub Pages, or any static host |

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

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
│       ├── router.ts                # Minimal History-API router (usePath, navigate)
│       ├── mistakeStore.ts          # IndexedDB persistence for wrong answers
│       ├── theme.ts                 # Design tokens + theme CSS
│       └── audio.ts                 # Web Audio API cue synthesizer
```

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

### Cloudflare Pages (recommended)

1. Cloudflare dashboard → Workers & Pages → Create application → **Pages**
2. Connect to Git, select this repo
3. Framework preset: Vite · Build command: `npm run build` · Output directory: `dist`
4. Save and Deploy

### Netlify Drop

```bash
npm run build
# Drag the dist/ folder onto app.netlify.com/drop
```

### Any Static Host

```bash
npm run build
# Upload the dist/ folder
```

## License

<!-- Add your chosen license here, e.g.: -->
<!-- This project is licensed under the MIT License — see [LICENSE](LICENSE) for details. -->

All rights reserved. Contact the author for licensing terms.
