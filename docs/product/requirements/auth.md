# Sign-in (AUTH)

> Google is the only way in. No passwords to store or reset.

Back to: [Requirements index](README.md) · [PRD overview](../prd.md) · Ships in: [Phase 0](../../roadmap.md#timeline-to-soft-launch) (AUTH-1), v1.1a (AUTH-2)

## Requirements

| ID | P | Requirement |
|---|---|---|
| AUTH-1 | P0 | Sign in with Google (OpenID Connect). The account is created from the Google profile (name, email, avatar) and the display name can be changed. A session lasts 30 days on a device. |
| AUTH-2 | P1 | Delete account removes every roll, scan, note and share link. Stored files are purged within 30 days. |

## Data

| Source | Shape |
|---|---|
| PRD | `User`: id, google_sub, email, display_name, avatar_url, created_at |
| [ADR-001](../../architecture/adr-001-tech-stack.md#data-model-mvp) | `user`: id, google_sub, name, avatar, owned by Better Auth, plus `session` and `account` |

Store only the Google subject ID and profile fields (PRD technical notes).

## Build notes

- [ADR-001](../../architecture/adr-001-tech-stack.md#decision): Better Auth with the Google provider, sessions in Postgres. No extra vendor.
- Phase 0 exit: "You sign in on a phone on a preview URL".
- AUTH-2 has to purge R2 objects (originals and derivatives) as well as rows. Originals are versioned for 30 days (PRD non-functional), which matches the 30-day purge window.

## Design

No sign-in artboard yet ([wireframes](../../design/wireframes.md#mvp-screens-with-no-artboard-yet)). Use `Button` (primary, one per screen) from the [design system](../../design/design-system.md#components).

## Open issues

- The ADR `user` table has no `email` column; the PRD keeps email. Decide whether email is stored.
