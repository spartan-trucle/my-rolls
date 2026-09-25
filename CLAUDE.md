# Cuộn — project memory

Cuộn is a web app for Vietnamese film shooters: log rolls, upload scans, keep a canister shelf and share rolls. The repo is `my-rolls`. Start with [README.md](README.md) and [docs/README.md](docs/README.md).

## Sources of truth

| Topic | Source of truth | Repo file | Rule |
|---|---|---|---|
| Requirements | [PRD artifact](https://claude.ai/artifact/9rfAShmDJUP9uFaDLikmu8) | `docs/product/prd.md`, `docs/product/requirements/*.md` | The artifact owns requirement wording. Deep-dives add analysis and must quote IDs exactly |
| Roadmap | [Roadmap artifact](https://claude.ai/artifact/Lsq7MWHNCVanpBWQ2D4XTo) (a Claude Docs doc) | `docs/roadmap.md` | **Always sync** (below) |
| Design system | [Design system artifact](https://claude.ai/artifact/HtsG9sZeNGx19PSvPjW65a) (Design System type, files under `project/`) | `docs/design/design-system.md` | **Always sync** (below) |
| Wireframes | [Design canvas](https://claude.ai/artifact/AXpgMvXFo6HL1vrw9RS6gt) | `docs/design/wireframes.md` | Reference only. Code may differ; the PRD and design system win on conflicts |
| Stack & architecture | This repo | `docs/architecture/adr-001-tech-stack.md` | Local only. Do not link or sync to the original claude.ai doc |

## Sync rules

The roadmap and the design system must always match their artifacts.

1. **Before reading them for a decision or editing them**, re-read the artifact:
   - Roadmap: Claude Docs `read` on doc `a0f678ba-bea4-4f78-8c12-abb694ef1d62` (tab body `2fbc853c-6b2d`).
   - Design system: `Artifact read` on the URL with `path` `project/README.md`, `project/tokens.json` and any `project/components/<Name>/README.md` in play.
2. **If the artifact changed** since the "Last synced" line in the mirror, update the mirror first, then continue.
3. **To change the roadmap or design system**, change the artifact (Claude Docs `update` for the roadmap; a design-system file publish for the design system), then copy the same change into the mirror in the same session.
4. **After every sync**, update the mirror's "Last synced" line: date (dd.mm.yyyy), artifact revision or version, and who.
5. Never edit a mirror without doing the same to its artifact. If you can't reach the artifact, say so and leave the mirror alone.

### Roadmap progress checklist

The roadmap's **Progress** section (per phase, content track, decisions) is a checklist that lives in both places.

- When work lands (a requirement merged, an exit check met, a decision made), tick the box in the artifact and in `docs/roadmap.md` in the same session, and bump "Last synced".
- Before ticking, re-read the artifact: boxes ticked there by hand (in the Claude Docs viewer) must be copied into the mirror first, never overwritten.
- Only tick a phase's exit item when its exit check actually holds. A merged PR alone doesn't meet an exit check.
- A decision is ticked only once its outcome is written into the Decisions due table and, where it applies, the PRD and [Known conflicts](docs/README.md#known-conflicts-between-sources) are updated.

## Known conflicts

Open conflicts between the PRD, ADR and design system are listed in [docs/README.md](docs/README.md#known-conflicts-between-sources). Check that table before any schema, upload, sharing or UI work, and don't silently pick a side.

## Conventions

- Product name in docs and code: **Cuộn**. The design system's `RollCall` namespace and token names stay as they are.
- Vietnamese is the UI language. Use the glossary in [the PRD overview](docs/product/prd.md#words-we-use) (cuộn, tấm ưng, túi, kệ…).
- Every screen needs a phone (390 px) and a desktop (1440 px) design. Screens without an artboard are listed in [wireframes.md](docs/design/wireframes.md#mvp-screens-with-no-artboard-yet).
- Plans live in `.planning/plans/`, specs in `.planning/specs/`.
