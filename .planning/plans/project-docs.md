# Plan: project docs from the Cuộn artifacts

Build the repo's documentation from the five claude.ai artifacts, link them, and add READMEs that connect everything.

## Sources and how each is treated

| Source | Artifact | Treatment in repo |
|---|---|---|
| Tech stack — ADR-001 | https://claude.ai/artifact/AE2zVZ3tpxqNf2BNtmhQqA | **Full local copy, local is the source of truth.** No link, no sync (per request). |
| PRD v0.4 (MVP) | https://claude.ai/artifact/9rfAShmDJUP9uFaDLikmu8 | Overview doc + one deep-dive doc per requirement area. Linked. |
| Roadmap | https://claude.ai/artifact/Lsq7MWHNCVanpBWQ2D4XTo | **Mirror.** The artifact is the source of truth; the local copy has a "last synced" header. |
| Design system (Roll Call) | https://claude.ai/artifact/HtsG9sZeNGx19PSvPjW65a | **Mirror.** Same rule as the roadmap. |
| Design canvas | https://claude.ai/artifact/AXpgMvXFo6HL1vrw9RS6gt | Reference index of the artboards only. Wireframes, not a spec. |

## Files to create or modify

```
README.md                               modify: project intro, doc map, artifact links, sync rules
CLAUDE.md                               new: project memory; sync rules for roadmap + design system; source-of-truth table
docs/README.md                          new: docs index + known conflicts between sources
docs/architecture/adr-001-tech-stack.md new: full copy of ADR-001 (mermaid diagrams kept)
docs/product/prd.md                     new: PRD overview (summary, problem, goals, users, north star, flows, NFRs, metrics, release plan, open questions)
docs/product/requirements/README.md     new: every requirement ID → priority → roadmap phase → deep-dive doc
docs/product/requirements/{auth,rolls,bag,catalogue,labs,scans,notes,canister,collection,sharing,compare}.md
                                        new: 11 deep-dives (reqs, flows, data, design boards, stack notes, open issues)
docs/roadmap.md                         new: mirror of the roadmap artifact
docs/design/design-system.md            new: mirror of the design system (principles, voice, tokens, type, components, iconography)
docs/design/wireframes.md               new: index of the 22 artboards by page and PRD area
```

## Steps

1. Write `docs/architecture/adr-001-tech-stack.md` and `docs/roadmap.md` (straight copies).
2. Write `docs/design/design-system.md` (README + token tables + component contracts) and `docs/design/wireframes.md`.
3. Write `docs/product/prd.md` and `docs/product/requirements/README.md`.
4. Write the 11 area deep-dives. Each links back to the PRD, the roadmap phase, the ADR tables it touches and the wireframes.
5. Write `docs/README.md` (index + conflicts), root `README.md` and `CLAUDE.md`.
6. Check every relative link resolves, then commit as `docs(cuon): add project docs from artifacts`.

## Test strategy

These are docs only, so there is no TDD. The check is that every relative link resolves (a script over `docs/**/*.md` and `README.md`) and every PRD requirement ID shows up exactly once in `requirements/README.md`. There are 55 IDs in total, 26 of them P0.

## Conflicts found between sources (documented, not resolved)

| # | Conflict | Sources |
|---|---|---|
| 1 | Product name: **Cuộn** (PRD, roadmap, ADR) vs **Roll Call** (design system, design canvas) vs repo `my-rolls` | all |
| 2 | TIFF + server-made copies (SCAN-1, SCAN-3) vs browser-made WebP, JPEG/PNG only | PRD vs ADR (roadmap decision #2) |
| 3 | "No file served carries GPS" (SHARE-1) vs full-size download = original bytes | PRD vs ADR (roadmap decision #3) |
| 4 | Mistakes: PRD has a Mistake/Note entity with 13 mistake types, several per frame (NOTE-2); ADR `frame.mark` is a single enum and has no mistake table | PRD vs ADR |
| 5 | Share token stored **hashed** (PRD tech notes) vs `share_link.token` stored plain | PRD vs ADR |
| 6 | PRD data model is richer (BagItem kind/qty/expiry, ScanSet process/scanner/price, Frame sha256/icc) than the ADR's MVP tables | PRD vs ADR |
| 7 | Upload drag-over: `cobalt-soft` + `cobalt` border (DS README) vs `pin-soft` + `pin` border (UploadDrop README) | inside design system |

## Risks

- Mirrors drift from the artifacts. Mitigation: a "last synced" line (artifact version + date) at the top of each mirror, plus a CLAUDE.md rule to re-read the artifact before editing either the mirror or the artifact.
- ADR-001 is marked **Proposed**. The local copy keeps that status.
- Deep-dives restate PRD content, so a PRD change means editing two places. Mitigation: deep-dives quote requirement text verbatim with the ID, and the PRD artifact stays the reference for wording.
