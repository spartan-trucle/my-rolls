# Plan: Phase 0 · Foundations

Stand up the whole Cuộn stack from [ADR-001](../../docs/architecture/adr-001-tech-stack.md): Next.js on Vercel `sin1`, Neon in Singapore, Drizzle, Better Auth (Google), R2, `next-intl` (vi), Tailwind mapped to the design tokens, PostHog, Sentry, the sign-in and sign-up screens from the design canvas, and the two spikes. It ends on the roadmap's Phase 0 exit check.

- **Roadmap:** Phase 0, 28 Sep – 11 Oct 2026, 16 h booked; this plan estimates ~22.5 h (see Risks). Roadmap artifact re-read 25.09.2026, rev 13, same as the mirror.
- **Design system:** artifact re-read 25.09.2026, version `1790317950-ff46`. The mirror is still on `1790307689-5eeb`: token values match, but the artifact README has a new **"In code"** section that sets how tokens, fonts and components enter the app. Stages C and E follow it.
- **Design canvas:** re-read 25.09.2026, version `1790318000-c9a4`. Page **"Đăng nhập"** has 12 boards: Login, Signup step 1 (Google), Signup step 2 (profile), each at 390 and 1440 px, in Paper and Darkroom. `docs/design/wireframes.md` still indexes the older `1790307652-d78a` and says sign-in has no artboard.
- **Status:** approved by Trúc 25.09.2026 (v2). v2 adds English naming (D15) and the canvas auth screens (D7, D16–D19).

## Decisions this plan assumes

Change any of these before approving.

| # | Decision | Default | Why |
|---|---|---|---|
| D1 | Scope | Full Phase 0 | Chosen 25.09.2026 |
| D2 | Neon | Vercel Marketplace (Vercel-managed), region `aws-ap-southeast-1`, preview branching **on**, Neon's "Managed Better Auth" **off** | Chosen 25.09.2026. ADR runs Better Auth itself |
| D3 | Domain | `*.vercel.app` until roadmap decision 1 (due 11.10) | Google redirect URIs, `BETTER_AUTH_URL` and the R2 public URL change once, when the domain lands |
| D4 | Schema in Phase 0 | **Better Auth tables only** (`user`, `session`, `account`, `verification`) | Known conflicts #4 and #6 block the roll/bag/frame tables until before Phase 1 |
| D5 | Email | Store it | Better Auth's `user` table requires it, and the Login board says Cuộn takes "tên, email và ảnh đại diện" from Google. Closes the open issue in [auth.md](../../docs/product/requirements/auth.md#open-issues); the ADR data model gets updated |
| D6 | `google_sub` | Lives in Better Auth's `account.account_id`, not on `user` | Better Auth's schema; the ADR table is updated to match |
| D7 | Auth screens | Build the canvas page **"Đăng nhập"** as designed: Login, Signup step 1, Signup step 2; phone + desktop; Paper + Darkroom | Chosen 25.09.2026 |
| D8 | OAuth on preview URLs | Better Auth `oAuthProxy` plugin | Every preview deploy has its own URL and Google has no wildcard redirects |
| D9 | Vercel preview protection | Keep on; you sign in to Vercel on your phone | Previews expose a live database branch |
| D10 | Migrations | `drizzle-kit generate` (SQL committed) + `drizzle-kit migrate` in the Vercel build, using `DATABASE_URL_UNPOOLED` | Each Neon preview branch gets migrated automatically |
| D11 | R2 public URL | `r2.dev` URL until the domain exists | A custom domain needs the domain on Cloudflare |
| D12 | ADR-001 status | Mark **Accepted** when this plan is approved | Building on it accepts it |
| D13 | Vercel project name | `my-rolls` | Matches the repo; rename freely once the name is decided |
| D14 | Git | Branch per stage (`feature/phase-0-<stage>`), PR to `main`; `main` is Vercel production. Commits `feat(cuon): …` | Global branching rules; scope matches earlier commits |
| D15 | Naming | **English for everything in code**: folders, files, components, route segments, i18n keys, DB tables and columns, env vars. Vietnamese only in UI copy (`messages/vi.json`) | Chosen 25.09.2026. Route folders are URLs, so URLs are English too: `/sign-in`, `/sign-up`, `/sign-up/profile` |
| D16 | Sign-in vs sign-up | One Google OAuth call behind both buttons. Better Auth `newUserCallbackURL` sends a first-time user to `/sign-up/profile`; a returning user goes home. Either button works for either user | Google-only auth has no separate sign-up; the two screens differ only in copy and where they land |
| D17 | Where step 2 "Tiếp tục" goes | A placeholder home until onboarding (`OnboardBag`, Phase 1) exists | Onboarding and the shelf are Phase 1 |
| D18 | Changing the display name later | Comes with the Profile screen (canvas "Kệ & hồ sơ") in Phase 1. Phase 0 covers setting it at step 2 | AUTH-1 says the name can be changed; step 2 is the first place, Profile is the second |
| D19 | "Điều khoản" / "Chính sách riêng tư" links on Signup step 1 | Placeholder pages `/terms` and `/privacy` now; real text added to the content track, due before the private beta (04.01.2027) | The design links them and nothing exists yet. Real users' Google data needs a real privacy notice |
| D20 | Sample photos on the auth screens | The canvas's own photos (5 scans), exported as WebP into `public/samples/` | The boards show them. Confirmed by Trúc 25.09.2026 |
| D21 | Theme toggle | Paper / Darkroom toggle as on every auth board; choice stored in a cookie so the server renders the right theme; default follows the system | Avoids a flash of the wrong theme on load |

## Who does what

Some steps need your accounts, logins or card. Claude never types passwords, card details or secrets, and secrets never go in the chat.

| Step | You | Claude (after your yes) | `fe-plan-executor` |
|---|---|---|---|
| Accounts | Install Vercel CLI + `vercel login`. Create Cloudflare account and complete R2 checkout. Create Sentry account. Confirm PostHog org | — | — |
| Vercel + Neon | Accept Neon Marketplace terms if asked | `vercel link`, region `sin1`, Git connect, `vercel integration add neon`, `vercel env pull` | — |
| Secrets | Paste Google, R2, Sentry secrets with `vercel env add` yourself | Generate `BETTER_AUTH_SECRET` without printing it | — |
| Design inputs | — | Read each component's README from the design-system artifact; export the sample photos from the canvas | — |
| Code | Review PRs | Review agent output | Stages B–G code, tests first |
| Device checks | Sign in on phone; test Web Share in Zalo, Messenger, Instagram | — | — |

## Files to create or modify

All paths and names in English (D15).

```
.gitignore                               new     node_modules, .next, .env*.local, .vercel, tsbuildinfo
package.json, pnpm-lock.yaml             new     create-next-app (TS, App Router, src/, Tailwind v4, ESLint), Vitest
next.config.ts                           new     next-intl + Sentry wrappers
vercel.json                              new     regions ["sin1"], build runs migrations
.env.example                             new     every required key, no values
src/env.ts                               new     typed env validation (zod)
src/app/api/health/route.ts              new     200 + DB ping

design-tokens/tokens.json                new     byte-for-byte copy of the artifact's tokens.json
scripts/build-tokens.ts                  new     `pnpm tokens` → src/styles/tokens.css
src/styles/tokens.css                    new     generated: Paper on :root, Darkroom on prefers-color-scheme + data-theme, Tailwind v4 @theme, Tailwind defaults off
src/app/fonts.ts                         new     next/font: Fraunces, Be Vietnam Pro, Space Mono, Patrick Hand, vietnamese subset
src/i18n/*, messages/vi.json             new     next-intl, vi only; keys in English (auth.signIn.title …)

src/design-system/Button/                new     typed React + CSS Module, no UI text (labels via props)
src/design-system/Field/                 new     same
src/design-system/Icon/                  new     roll, keeper, share + the rest of the set
src/design-system/Print/                 new     desktop auth panel (also needed in Phase 3)
src/design-system/FilmStrip/             new     phone Login (also needed in Phase 3)
src/design-system/Scribble/              new     notes on the auth boards
src/design-system/index.ts               new     exports

src/components/auth/GoogleButton.tsx     new     Google-branded button from the boards
src/components/auth/AuthLayout.tsx       new     phone: single column; desktop: photo panel left, form right
src/components/theme/ThemeToggle.tsx     new     Paper / Darkroom switch (D21)
src/app/(auth)/sign-in/page.tsx          new     Login board
src/app/(auth)/sign-up/page.tsx          new     Signup step 1
src/app/(auth)/sign-up/profile/page.tsx  new     Signup step 2: display name, email read-only
src/app/(legal)/terms/page.tsx           new     placeholder (D19)
src/app/(legal)/privacy/page.tsx         new     placeholder (D19)
src/app/page.tsx                         new     placeholder home (D17)
public/samples/*.webp                    new     sample photos (D20)

drizzle.config.ts, src/db/*              new     Neon client, Better Auth schema
drizzle/*.sql                            new     generated migrations
src/lib/auth.ts, auth-client.ts          new     Better Auth: Google, 30-day session, oAuthProxy, newUserCallbackURL
src/app/api/auth/[...all]/route.ts       new     Better Auth handler
src/proxy.ts                             new     session gate (Next 16 name for middleware)
src/lib/r2.ts                            new     S3 client + presign helpers
src/app/providers.tsx                    new     PostHog provider
sentry.*.config.ts, instrumentation.ts   new     Sentry
src/app/spike/og/route.tsx               new     1080×1920 story PNG with "tấm ưng" (Spike 1)
src/app/spike/share/page.tsx             new     Web Share with files (Spike 2)
tests/**                                 new     see Test strategy

docs/architecture/adr-001-tech-stack.md  modify  Accepted; user/account shape; email; oAuthProxy; r2.dev interim
docs/design/design-system.md             modify  sync to artifact `1790317950-ff46` ("In code" section)
docs/design/wireframes.md                modify  re-index canvas `1790318000-c9a4`: pages "Đăng nhập" and "Kệ & hồ sơ"; take Sign-in off the no-artboard list
docs/product/requirements/auth.md        modify  email decided; link the auth boards
docs/roadmap.md + roadmap artifact       modify  tick Phase 0 items as they land
README.md                                modify  status, how to run locally
```

## Implementation steps

Each step is at most half a day. A stage ends in a PR that deploys a preview.

### Stage A · Accounts, provisioning, doc sync (~2 h, no code)

1. **You:** install and log in to the Vercel CLI; create the Cloudflare and Sentry accounts; complete R2 checkout; confirm the PostHog org.
2. **Claude:** docs, all in one commit:
   - Sync the design-system mirror to `1790317950-ff46`.
   - Re-index `wireframes.md` to canvas `1790318000-c9a4`.
   - Mark ADR-001 Accepted and fix its user/account shape (D5, D6).
   - Close the email issue in `auth.md`.
3. **Claude:** `vercel link` as project `my-rolls`, connect `NganTrucLe/my-rolls`, production branch `main`.
4. **Claude:** add Neon from the Marketplace with Singapore and preview branching on, then `vercel env pull .env.local`. Check that `DATABASE_URL` and `DATABASE_URL_UNPOOLED` exist (names only).
5. **Claude:** generate `BETTER_AUTH_SECRET` into Vercel for all three environments without echoing it.

### Stage B · App skeleton (~3 h)

6. Delete the stray untracked `node_modules/`, `.next/`, `next-env.d.ts`, `tsconfig.tsbuildinfo`. The `.gitignore` is already in place (added 25.09.2026). `create-next-app` refuses a folder that already holds `CLAUDE.md`, `docs/`, `.claude/` and `.planning/`, so scaffold it in the scratchpad (pnpm, TS, App Router, `src/`, Tailwind v4, ESLint) and copy the app files in, **keeping our `.gitignore` and `README.md`**. Add Vitest + Testing Library and the `test`, `lint`, `build` scripts.
7. `src/env.ts` validation, test first: missing key → clear error naming the key.
8. `/api/health`, test first: 200 with `{ ok, db }`; DB down → 503.
9. `vercel.json` with `sin1`; `.env.example`. First preview deploy; check the function region in the deploy output.

### Stage C · Tokens, fonts, language, theme (~3.5 h)

10. Copy `tokens.json` byte for byte. Write the two tests first:
    - The generated CSS is out of date → fail.
    - Every text/ground contrast pair meets its target in both themes (4.5:1 for text; 3:1 for `line-strong` and `focus`).

    Then write `scripts/build-tokens.ts` → `src/styles/tokens.css`, with Tailwind's own colours, fonts, text sizes, radii and shadows switched off.
11. `next/font` for the four families with the `vietnamese` subset, wired to the `display` / `sans` / `mono` / `hand` token families.
12. `next-intl` with `vi` as the only locale, `messages/vi.json`, English keys. Test: a key with diacritics ("tấm ưng", "Đăng nhập bằng Google") renders as is.
13. Theme: `data-theme` on `<html>` from a cookie, system default. Tests first: no cookie → no attribute; cookie `dark` → `data-theme="dark"`. Then `ThemeToggle` with `aria-pressed` and the Vietnamese label from messages.

### Stage D · Database and Better Auth (~3 h)

14. Drizzle + Neon driver, `drizzle.config.ts`, Better Auth schema, first migration. The build runs `drizzle-kit migrate`. Check: a preview deploy creates its Neon branch, and the tables exist.
15. **You:** create the Google OAuth client. Redirect URIs: `http://localhost:3000/api/auth/callback/google` and the production callback URL. Add `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` with `vercel env add`.
16. Better Auth with Google, 30-day session, `oAuthProxy`, `newUserCallbackURL: /sign-up/profile`. Tests first:
    - The session lasts 30 days.
    - A new user gets name, email and avatar from the Google profile (mocked).
    - A new user is sent to `/sign-up/profile`; a returning user is sent to `/`.
17. `proxy.ts`: signed-out users hitting a protected route go to `/sign-in`, and signed-in users hitting `/sign-in` or `/sign-up` go home. Tests first. Sign-out action.

### Stage E · Design-system components (~3 h)

18. Claude reads `project/components/<Name>/README.md` from the design-system artifact for Button, Field, Icon, Print, FilmStrip and Scribble, per the sync rule, and hands them to the agent.
19. Port the six components to `src/design-system/` as typed React with CSS Modules and no UI text. Tests first, per component:
    - It renders with props only.
    - Accessible names come from props.
    - Its focus ring uses `focus`.
    - Print and FilmStrip honour `tilt`, `oops` and `keeper` as in the READMEs.

### Stage F · Auth screens (~3 h)

20. `AuthLayout`, `GoogleButton`, sample photos, and the placeholder `/terms`, `/privacy` and home pages.
21. `/sign-in` and `/sign-up` from the boards: copy from `messages/vi.json`, both buttons calling the same Google sign-in (D16). Tests:
    - Each page renders its heading and one Google button.
    - The cross-links between the two pages work.
22. `/sign-up/profile`: avatar, editable display name (`Field`), read-only email "từ Google", "Tiếp tục" saving the name, "Dùng tài khoản Google khác" signing out and back to `/sign-up`. Tests first:
    - An empty name → error in `pin` with a human message.
    - Saving updates `user.name`.
23. Visual check against the boards at 390 and 1440 px in both themes (browser preview screenshots next to the canvas).

### Stage G · Storage, observability, spikes (~4.5 h)

24. **You:** in R2, create `cuon-originals` (private) and `cuon-public` (public on `r2.dev`), plus an API token scoped to those two buckets. Add the `R2_*` keys with `vercel env add`.
25. `src/lib/r2.ts` presign helpers, test first: key shape, 10 MB cap, content-type allow-list.
    - Bucket CORS allows PUT from `localhost:3000` and the Vercel URLs.
    - Smoke script: presign → PUT 1 KB → GET from `r2.dev` → delete.
26. PostHog: provider and pageview on the Cuộn project. Sentry: `@sentry/nextjs` with source maps. Check: one test event reaches each; the test error route is removed after.
27. Spike 1: `next/og` renders a 1080 × 1920 PNG with Be Vietnam Pro loaded from font files and "tấm ưng" on it. Test: 200, `image/png`, 1080 × 1920. You check the diacritics by eye.
28. Spike 2: a page that calls `navigator.canShare({ files })` and shares that PNG. You try it in iPhone Safari, Android Chrome, and the Zalo, Messenger and Instagram in-app browsers. Results go in a spike note (new doc; you decide where).

### Stage H · Exit (~0.5 h)

29. **You:** on your phone, on a preview URL, sign up as a new user through all three screens, sign out, and sign in again. The story PNG shows "tấm ưng" correctly.
30. **Claude:** tick Phase 0 in the roadmap artifact and `docs/roadmap.md`, and bump "Last synced". The exit box is ticked only after step 29 holds. Update the README status.

## Test strategy

- **Unit (Vitest), written before the code:**
  - Env validation and the health route.
  - Token generation, staleness and contrast pairs.
  - i18n rendering and the theme cookie.
  - Auth config: session length, profile mapping, new vs returning redirect, and the proxy gate.
  - The six design-system components.
  - The auth pages and the display-name form.
  - Presign helpers and the OG route shape.
- **Integration, run by hand:** a preview deploy creates a Neon branch and migrates it; the R2 smoke script; PostHog and Sentry test events.
- **Visual:** screenshots at 390 and 1440 px in both themes, next to the canvas boards.
- **Every PR:** `pnpm lint`, `pnpm test` and `pnpm build` pass locally, then on the Vercel preview.
- **On devices, by you:** the full sign-up and sign-in on a phone; Web Share in the five browsers.

## Risks

| Risk | Mitigation |
|---|---|
| ~22.5 h against 16 h booked | The extra is mostly Print, FilmStrip and the other components, which Phase 3 needs anyway. This takes ~6.5 h of the 30 h buffer; Phase 3 should need about 3 h less |
| Google rejects the dynamic preview URLs | `oAuthProxy` (D8); only the production and localhost callbacks are registered |
| Preview protection blocks the phone | Sign in to Vercel on the phone (D9) |
| Neon's free plan caps branches, and stale preview branches pile up | Check the integration's branch cleanup; delete stale branches by hand if needed |
| A migration in the build breaks production | Phase 0 has only additive auth tables; revisit before Phase 1 |
| Next 16 / Tailwind v4 / Better Auth APIs differ from what the agent remembers | The agent checks current docs (Context7) before each stage |
| The canvas boards are wireframes, so code may drift from them | The PRD and design system win on conflicts; note any deliberate change in the PR |
| Terms and privacy are placeholders | They must be real before beta (D19); added to the content track |
| R2 CORS may not take wildcard origins | List the exact origins; add the branch alias as needed |
| `r2.dev` is rate-limited and not for production | Interim until the domain (D11) |
| Web Share with files fails in in-app browsers | That's what Spike 2 is for; the fallback is download + "mở trong trình duyệt" (roadmap risk) |
| The domain decision (11.10) forces config changes | Keep every URL in env; checklist: Google redirect URIs, `BETTER_AUTH_URL`, R2 domain, Vercel domain |
| Secrets leak into the chat or the repo | `.env*.local` gitignored; secrets entered only through `vercel env add` by you |
