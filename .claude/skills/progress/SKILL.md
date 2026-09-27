---
name: progress
description: Check and update Cuộn's progress — the roadmap Progress checklist (artifact + docs/roadmap.md mirror) and the active phase plan's Progress section in .planning/plans/. Use when the user says /progress, "check progress", "update progress", "tick the roadmap", "what's left in this phase", or after a PR merges.
argument-hint: "[check | update]  (default: check, then offer update)"
---

# /progress — check and update progress

Two jobs: **check** (read-only report of where the phase stands and what's out of sync) and **update** (tick what has landed, in the artifact and the mirror, and record it in the plan). Rules come from [CLAUDE.md](../../../CLAUDE.md#sync-rules); this skill only orders them. Never tick on a hunch: every tick needs evidence you can name.

Sources:

| What | Where |
|---|---|
| Roadmap artifact (source of truth) | Claude Docs doc `a0f678ba-bea4-4f78-8c12-abb694ef1d62`, tab body `2fbc853c-6b2d`. Load the docs skill (or `guide topic.index` + `topic.editing`) before any docs call |
| Roadmap mirror | `docs/roadmap.md` → `## Progress` and the `Last synced` line (revision number = the artifact's `rev`) |
| Phase plan | `.planning/plans/phase-<n>-*.md` → `## Progress` |
| What landed | `git log origin/main`, `gh pr list --repo spartan-trucle/my-rolls --state merged`, Vercel commit statuses |

## 1. Check (always, read-only)

1. `git fetch`. Note `origin/main`'s head, its author, and its Vercel status:
   `gh api repos/spartan-trucle/my-rolls/commits/<sha>/statuses --jq '[.[]|select(.context|test("Vercel";"i"))][0]|"\(.state) \(.description)"'`.
   **"Deployment was blocked"** = Vercel Hobby refused a commit not authored by NganTrucLe (a squash or merge commit clicked from the Spartan account). Report it first: production is not running `main`. Fix is the user's: `git commit --allow-empty -m "chore(cuon): trigger vercel deploy" && git push origin main` from this checkout (it commits as NganTrucLe), and "Rebase and merge" next time.
2. Read the artifact's Progress lists: `read` with `{"kind":"view","sinceRev":<rev in the mirror's Last synced line>}`. Nothing changed → say so. Something changed → view the changed lists (`parentId`) and diff each `checked` against the mirror's `- [x]`/`- [ ]`.
3. Read the active phase plan's `## Progress` (the lowest-numbered plan whose phase isn't fully ticked in the roadmap).
4. Map evidence to each **unticked** roadmap item of the current phase: merged PRs (title, number, merge date), plan progress lines, test/deploy results. Classify each item:
   - **Landed**: merged to `main` *and* deployed (not blocked) *and* any check the plan attaches to it holds.
   - **Needs the user**: a device test, a by-eye check, a console step, or anything only the user can confirm.
   - **Not started / in progress**.
5. Report, in this order, and stop if the argument was `check`:
   - Deploy status of `main` (blocked or not).
   - Out of sync: artifact vs mirror (hand ticks in the artifact not yet in the mirror), mirror vs `Last synced`.
   - A table: item · status · evidence (PR link as `[owner/repo#N](url)`, commit, or "needs you: <what exactly to check>").
   - Content track and Decisions due that are due within 14 days.

## 2. Update (after the user says yes to the ticks)

Only tick items the user confirmed or whose evidence is in the report. Exit items (`Exit: …`) are ticked only when their exit check holds as worded — a merged PR alone never meets one. A decision is ticked only once its outcome is in the Decisions due table and, where it applies, the PRD and docs/README.md Known conflicts.

1. **Artifact first, mirror second.** Re-read with `sinceRev` (people tick by hand in the viewer). Copy any hand ticks into the mirror before writing, never overwrite them.
2. Tick in the artifact: one `update` on the tab body with `{"op":"set","target":{"kind":"blocks","ids":["<listItem id>"]},"attrs":{"checked":true}}` per item. Note the new `rev` from the ack.
3. Same ticks in `docs/roadmap.md`. Bump `Last synced`: date `dd.mm.yyyy` · `doc revision <new rev>` · `by Claude for Trúc`, appending what this revision ticked and on whose confirmation.
4. Add a dated line to the plan's `## Progress` (what was ticked, the evidence, who confirmed). Close or narrow any `**Open:**` line it resolves.
5. Commit on a branch, never on `main`: `docs/<phase>-progress[-<topic>]`, title `docs(cuon): tick <what> in <phase> roadmap` + the attribution trailer. Stage only the files you changed (other untracked plans are not yours).
6. Push and offer the PR. Remind: merge with **Rebase and merge**.

If the artifact can't be reached, say so and change nothing in the mirror (CLAUDE.md sync rule 5).

## Don't

- Don't tick from memory, from a PR title alone, or from a subagent's claim — only from evidence you checked or the user's word in chat.
- Don't read or print `.env*` files or secrets while gathering evidence.
- Don't edit requirement wording, dates or hours in the roadmap — that's a roadmap change, not progress; ask first.
