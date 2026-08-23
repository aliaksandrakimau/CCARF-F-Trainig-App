# CLAUDE.md

## Project Overview

CCAR-F Practice Trainer — unofficial study tool for the Claude Certified Architect Foundations certification exam. React 18 + TypeScript + Vite, CSS Modules, Web Audio API. Zero runtime dependencies beyond React.

## Commands

```bash
npm run dev       # Vite dev server
npm run build     # Production build to dist/
npm run preview   # Preview production build locally
```

No test suite is configured. No linting is configured.

## Architecture

- `App.tsx` — root component, all state lives here (lifted state pattern)
- `src/components/` — presentational + view components (PracticeView, ExamView, ResultsView)
- `src/data/` — static question bank (90 items) and domain config with exam form builder
- `src/hooks/` — `usePracticeTimer`, `useExamTimer` (custom hooks for countdown logic)
- `src/lib/` — pure utilities (`utils.ts`) and Web Audio cue synthesizer (`audio.ts`)
- `src/styles/` — CSS Modules per component + `theme.css` for CSS custom properties
- `src/types.ts` — shared TypeScript types

## React Best Practices

### Component Design

- Keep components small and focused — one responsibility per component.
- Extract reusable UI into dedicated components (`Option`, `DomainChip`, `TypePill`).
- Use named exports, not default exports (except for the root `App`).
- Colocate component styles: `Component.tsx` + `component.module.css` in the same directory.

### State Management

- All application state lives in `App.tsx` and is passed down via props.
- Use `useState` for simple state, `useMemo` for derived calculations (`results`, `filteredIds`).
- Use `useRef` for mutable values that don't trigger re-renders (timer IDs).
- Prefer functional state updates (`setState(prev => ...)`) over direct values when the new state depends on the previous one.
- Avoid deeply nested state objects — keep state flat.

### Hooks

- Custom hooks should return stable objects with named fields, not arrays.
- Clean up side effects (timers, intervals) in effect return functions.
- Don't call hooks conditionally — always at the top level.
- Name hooks with `use` prefix.

### TypeScript

- Use `interface` for component props and data structures.
- Use `type` for unions and aliases (`DomainKey`, `OptionState`, `View`).
- Avoid `any` — use `unknown` if the type is truly unknown.
- Use non-null assertion `!` sparingly — prefer explicit null checks.
- Type state setters in props: `setFilter: (f: DomainKey | "ALL") => void`.

### Styling

- Use CSS Modules for component-scoped styles.
- Define design tokens as CSS custom properties in `theme.css`.
- Use `data-theme` attribute on root for theme switching.
- Use semantic class names (`optionCorrect`, `timerDisplayWarning`) over layout names.
- Avoid inline styles except for dynamic values (width percentages).

### Performance

- Memoize expensive computations with `useMemo` (`results`, `filteredIds`).
- Avoid creating new objects/functions in render — use `useCallback` for event handlers passed as props.
- Don't import entire modules when you only need one export.

### Testing (when added)

- Test component behavior, not implementation details.
- Use React Testing Library for component tests.
- Mock timers with `jest.useFakeTimers()` for timer-dependent tests.
- Test accessibility (roles, labels) alongside functionality.

## Code Style

### Comments

Add concise English comments when the code alone does not convey *why* something works the way it does — non-obvious control flow, workarounds, domain rules, or timing-dependent logic. Never comment what the code obviously does (`// increment i`). Comments should help a future agent or developer understand intent without reading surrounding context.

- Use `//` for inline comments above or beside the relevant line.
- Use `/** ... */` for JSDoc on exported interfaces and functions that have non-trivial contracts.
- Prefer a short sentence over a paragraph.

- Use 2-space indentation.
- Single quotes for strings.
- Trailing commas in multi-line structures.
- Prefer `const` over `let`.
- Use optional chaining (`?.`) and nullish coalescing (`??`).
- Keep functions short — extract helper functions for complex logic.

## Data Patterns

- Question bank is static TypeScript arrays — no fetching or runtime loading.
- Exam form is built dynamically from the question bank using domain quotas.
- Audio cues are synthesized via Web Audio API — no external audio files.
- Theme preference persists to `localStorage`.
- Sound preference persists to `localStorage`.


## Git Conventions

- Use conventional commits: `fix:`, `feat:`, `refactor:`, `chore:`.
- Keep commits atomic — one logical change per commit.
- Don't commit `dist/`, `node_modules/`, or `.local` files.
- **Never commit or push without an explicit command from the user.** All changes are staged/committed/pushed only when the user says so.
