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
| [ADR-001](../../architecture/adr-001-tech-stack.md#data-model-mvp) | `user`: id, name, email, email_verified, image, created_at, owned by Better Auth, plus `session`, `account` (Google subject ID in `account.account_id`) and `verification` |

Store only the Google subject ID and profile fields (PRD technical notes).

## Build notes

- [ADR-001](../../architecture/adr-001-tech-stack.md#decision): Better Auth with the Google provider, sessions in Postgres. No extra vendor.
- Better Auth's `oAuthProxy` plugin lets sign-in work on preview URLs, which Google can't list one by one.
- Sign-in and sign-up are the same Google call. A first-time user lands on sign-up step 2 (`/sign-up/profile`) to check the display name; a returning user goes home.
- Phase 0 exit: "You sign in on a phone on a preview URL".
- AUTH-2 has to purge R2 objects (originals and derivatives) as well as rows. Originals are versioned for 30 days (PRD non-functional), which matches the 30-day purge window.

## Design

The design canvas page "Đăng nhập" has three screens, each for phone and desktop in both themes: Login, Sign-up step 1 (Google) and Sign-up step 2 (profile from Google: editable display name, read-only email). See [wireframes](../../design/wireframes.md). Changing the display name later belongs to the Profile board on the "Kệ & hồ sơ" page.

## Open issues

- ~~The ADR `user` table has no `email` column; the PRD keeps email.~~ Decided 25.09.2026: email is stored. Better Auth requires it, and the Login board tells people Cuộn takes their name, email and avatar from Google.
- The sign-up step 1 board links to Terms and Privacy pages that don't exist yet. They need real text before the private beta.
