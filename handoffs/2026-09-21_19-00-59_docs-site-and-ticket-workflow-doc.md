---
date: 2026-09-21T19:00:59+05:30
git_commit: 235cf91
branch: main
task: Build the docs site and its first document, the ticket workflow explainer
---

# Handoff: Docs site live on GitHub Pages, first document written

## What Happened

Built `~/git/docs` from an empty repo: a Next.js App Router site with `output: 'export'`,
TypeScript and Tailwind v4, deployed to GitHub Pages by an Actions workflow. Three commits are
pushed to `main`.

The first document — "How a ticket becomes shipped software" — describes the four-phase ticket
workflow (Context, Codebase Research, Implementation Plan, Implementation) plus setup, review,
release, phase states, known gaps and the tooling behind it. Facts were verified against
`/Users/jassu/git/ks/plugins/ks/` rather than paraphrased; every internal command, script and
subagent is hyperlinked to its source on GitHub via `refs.ts`.

Its nine diagrams are data (nodes/edges in `diagrams.ts`) rendered by one `<FlowDiagram>`
primitive as inline SVG. `lib/flow.ts` lays them out twice: a grid on wide screens, a single
column with a left lane for loop-backs on narrow ones. `scripts/check-diagrams.ts` walks every
diagram in both layouts and fails on overlapping boxes, arrows crossing unrelated boxes, or
labels landing on them — it caught several real bugs.

The document went through many rounds of the user's review: phase numbering removed, tone
flipped from de-jargoned to technical, wording cut for concision, and the iteration mechanics
corrected against `WORKFLOW.md` (a new plan file per iteration, after the current plan finishes).

## Key Decisions Made

- **Hand-rolled SVG over React Flow / Mermaid / D2.** Every library alternative emits one fixed
  SVG that only scales — 4px text on a phone, the flat-image failure the doc exists to beat. Two
  layouts of the same data is what makes the reflow possible. Cost is hand-written routing,
  mitigated by `check-diagrams`.
- **`pnpm build:check` builds from a temp copy** (`scripts/build-check.sh`). `next build` rewrites
  `.next` regardless of `distDir`, which repeatedly broke the running dev server. An earlier
  `distDir` fix looked right and did nothing.
- **Volatile detail stays out of the page.** No field lists, no schema keys — they change and the
  doc would rot. Commands and schemas are the source of truth.
- **Local Claude settings untracked**; `.claude/commands/create_handoff.md` committed.

## Deviations from Plan

The original brief specified an external, non-technical audience with no internal tool names. The
user reversed that: technical wording, real names, and a tooling section explaining each internal
piece. The brief's "no company/tool names" constraint no longer applies to this document.

## Uncommitted Changes

- `app/docs/how-a-ticket-becomes-shipped-software/page.tsx` — Known Gaps moved below "Why it is
  shaped this way", and Greptile added to the review flow and the tooling list.

## Known Issues

- **GitHub Pages is not enabled.** `GET /repos/Jassu225/docs/pages` returns 404, so every run
  fails at `actions/deploy-pages`. The `build` job succeeds. Fix: Settings → Pages → Source:
  GitHub Actions, then re-run. This is a manual UI step, deliberately left to the user.
- **`@types/node` is still `^22`.** `pnpm add -D @types/node@^24` fails in the sandbox with
  `ERR_PNPM_EPERM` writing to the global pnpm store. Run it outside the sandbox.
- **SSH pushes do not work from the sandbox.** Pushes go over HTTPS with
  `git -c credential.helper='!gh auth git-credential' push https://github.com/Jassu225/docs.git main`.
  The `origin` remote is still SSH, which works from the user's own shell.
- `/code-review` is the one command in the document with no hyperlink — it is built into Claude
  Code, so there is no file to point at.

## Resume Point

1. Commit and push the two pending edits in `page.tsx`.
2. Ask the user whether Pages has been enabled; if yes, re-run the latest workflow and confirm
   https://jassu225.github.io/docs/ serves the page.
3. Before any further edit to the document, read the memory files — concise wording, technical
   naming, "skill" not "slash command" — and verify facts against
   `/Users/jassu/git/ks/plugins/ks/` rather than assuming.
4. Checks to run after any change: `npx eslint .`, `npx tsc --noEmit`,
   `pnpm check:diagrams`, `pnpm build:check`. Never run `pnpm build` while `pnpm dev` is up.
