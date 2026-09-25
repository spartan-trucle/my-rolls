# Cuộn

Cuộn (Vietnamese for "roll") is a home for film rolls, made for Vietnamese film shooters and free to use.

- Log a roll from your bag in under a minute.
- Keep it as a canister on your shelf.
- Share it as a story card and a link friends open without an account.

Compare rolls and labs once there is enough data.

> Repo name: `my-rolls`. Product name: **Cuộn** (working name). The design system and wireframes still say "Roll Call"; see [Known conflicts](docs/README.md#known-conflicts-between-sources).

**Status:** pre-build. PRD v0.4 is a draft for review, ADR-001 is proposed, and the build starts 28.09.2026 with soft launch planned for **18.01.2027**.

## Start here

| If you want to know… | Read |
|---|---|
| What we're building and why | [PRD overview](docs/product/prd.md) |
| A specific requirement (e.g. SHARE-1) | [Requirements index](docs/product/requirements/README.md) → its area deep-dive |
| How it's built | [ADR-001: tech stack & architecture](docs/architecture/adr-001-tech-stack.md) |
| What ships when | [Roadmap](docs/roadmap.md) |
| How it looks and sounds | [Design system](docs/design/design-system.md) |
| Which screens are designed | [Wireframes](docs/design/wireframes.md) |
| Where the sources disagree | [Known conflicts](docs/README.md#known-conflicts-between-sources) |

Full map: [docs/README.md](docs/README.md).

## Source artifacts

| Artifact | Link | In this repo | Sync |
|---|---|---|---|
| PRD v0.4 (MVP) | [claude.ai/artifact/9rfAShmDJUP9uFaDLikmu8](https://claude.ai/artifact/9rfAShmDJUP9uFaDLikmu8) | [Overview](docs/product/prd.md) + [11 deep-dives](docs/product/requirements/README.md) | The artifact owns requirement wording; the deep-dives add analysis |
| Roadmap | [claude.ai/artifact/Lsq7MWHNCVanpBWQ2D4XTo](https://claude.ai/artifact/Lsq7MWHNCVanpBWQ2D4XTo) | [docs/roadmap.md](docs/roadmap.md) | **Always in sync.** The artifact is the source of truth |
| Design system | [claude.ai/artifact/HtsG9sZeNGx19PSvPjW65a](https://claude.ai/artifact/HtsG9sZeNGx19PSvPjW65a) | [docs/design/design-system.md](docs/design/design-system.md) | **Always in sync.** The artifact is the source of truth |
| Design (wireframes) | [claude.ai/artifact/AXpgMvXFo6HL1vrw9RS6gt](https://claude.ai/artifact/AXpgMvXFo6HL1vrw9RS6gt) | [docs/design/wireframes.md](docs/design/wireframes.md) | Reference only; code may differ |
| Tech stack (ADR-001) | not linked | [docs/architecture/adr-001-tech-stack.md](docs/architecture/adr-001-tech-stack.md) | Not synced; the repo copy is the source of truth |

The sync rules are in [CLAUDE.md](CLAUDE.md#sync-rules).

## Stack at a glance

Next.js (App Router, TypeScript) on Vercel `sin1` · Postgres on Neon (Singapore) with Drizzle · Cloudflare R2 for photos, with browser uploads via presigned URLs · Better Auth (Google) · `next-intl` (vi) · Tailwind mapped to design tokens · `next/og` for link previews and story cards · PostHog + Sentry. Details and trade-offs: [ADR-001](docs/architecture/adr-001-tech-stack.md).

## Repo layout

```
README.md                  you are here
CLAUDE.md                  project memory for Claude: sources of truth, sync rules
.claude/                   hook that reminds Claude to create or sync docs
docs/
  README.md                docs map + known conflicts
  product/
    prd.md                 PRD overview
    requirements/          index + one deep-dive per requirement area
  architecture/
    adr-001-tech-stack.md
  roadmap.md               mirror of the roadmap artifact
  design/
    design-system.md       mirror of the design system artifact
    wireframes.md          index of the design canvas
.planning/                 specs and plans (spec → plan → build)
```
