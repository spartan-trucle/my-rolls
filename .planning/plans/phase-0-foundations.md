# Plan: Phase 0 · Foundations

Stand up the whole Cuộn stack from [ADR-001](../../docs/architecture/adr-001-tech-stack.md): Next.js on Vercel `sin1`, Neon in Singapore, Drizzle, Better Auth (Google), R2, `next-intl` (vi), Tailwind mapped to the design tokens, PostHog for analytics and errors, the sign-in and sign-up screens from the design canvas, and the two spikes. It ends on the roadmap's Phase 0 exit check.

- **Roadmap:** Phase 0, 28 Sep – 11 Oct 2026, 16 h booked; this plan now estimates ~17.5 h, because PR #1 already delivered tokens, fonts and components (see Risks). Roadmap artifact re-read 25.09.2026, rev 13, same as the mirror.
- **Design system:** artifact re-read 25.09.2026, version `1790317950-ff46`. The mirror is still on `1790307689-5eeb`: token values match, but the artifact README has a new **"In code"** section that sets how tokens, fonts and components enter the app. Stages C and E follow it.
- **Design canvas:** re-read 25.09.2026, version `1790318000-c9a4`. Page **"Đăng nhập"** has 12 boards: Login, Signup step 1 (Google), Signup step 2 (profile), each at 390 and 1440 px, in Paper and Darkroom. `docs/design/wireframes.md` still indexes the older `1790307652-d78a` and says sign-in has no artboard.
- **Status:** approved by Trúc 25.09.2026 (v2). v2 adds English naming (D15) and the canvas auth screens (D7, D16–D19). v3 (25.09.2026, Trúc) drops Sentry for PostHog error tracking (D22) and adds what Stage A turned up (D23–D25). v4 (25.09.2026) rebuilds the branch on `main` after [PR #1](https://github.com/NganTrucLe/my-rolls/pull/1) (design system foundation, plan `.planning/plans/design-system-foundation.md`), which already covers Stage C steps 10–11 and Stage E.

## Progress

- [x] Stage A step 3: Vercel project `ngantrucles-projects/my-rolls` linked, GitHub `NganTrucLe/my-rolls` connected (25.09.2026)
- [x] Stage A step 4: Neon `my-rolls-db` via Marketplace: region `sin1`, plan `free_v3`, Neon Auth off, connected to Production, Preview, Development (25.09.2026)
- [x] Stage A step 5: `BETTER_AUTH_SECRET` set: one shared value for Production + Preview (sensitive), a separate one for Development (25.09.2026)
- [x] Stage A step 2: doc sync: design-system mirror → `1790324661-b252`, wireframes re-indexed → canvas `1790318000-c9a4`, ADR-001 Accepted, auth.md email decided, roadmap artifact + mirror → rev 15 without Sentry (25.09.2026)
- [x] Preview branching on (D24): "Create Database Branch For Deployment → Preview", "Require Active Resource Before Deploy" on. Database env vars now Sensitive and only in Production + Preview, so local dev never gets production credentials (25.09.2026, Trúc)
- [x] Neon skill files kept and committed (D25, 25.09.2026)
- [x] R2 checkout done by Trúc (25.09.2026)
- [x] PostHog project for Cuộn (US Cloud): `NEXT_PUBLIC_POSTHOG_KEY` (public project token, stored as Config on purpose) and `NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com` in all three Vercel environments. The project has exception autocapture off, so Stage G turns it on in code with `posthog-js`' `capture_exceptions` (D22) (25.09.2026)
- [x] Stage B steps 6–8 + local part of 9: Next.js 16.3.6, React 19.2.8, Tailwind 4.3.3, Vitest 5.0.1, zod env, `/api/health`, `vercel.json` (`nextjs`, `sin1`). 9/9 tests, lint clean, build clean, health 200 (25.09.2026)
- [x] Branch rebuilt on `main` after PR #1 (25.09.2026): our scaffold and `agentRules` commits dropped, env + `/api/health` + `vercel.json` + docs + Neon skills kept, tests moved next to their code as on `main`. 150 tests pass, typecheck clean
- [x] Stage C steps 10–11 (tokens, fonts) and Stage E (all nine components) done by PR #1
- [x] Stage D steps 14, 16, 17: Drizzle 0.45 + `pg` Pool (transactions for Better Auth) with `attachDatabasePool`, Better Auth 1.7.5 (Google, 30-day session, `oAuthProxy`, `nextCookies`), skip header for localhost and the branch alias, `proxy.ts` gate, server sign-out. 233 tests. Migration `0000` applied on the Neon dev branch and by the Vercel build on the preview branch (`vercel-build` = migrate + build), deploy Ready (25.09.2026)
- [x] Stage F steps 20–22: `/sign-in`, `/sign-up`, `/sign-up/profile` from the "Đăng nhập" boards, `AuthLayout`, `GoogleButton`, sample WebPs (334 KB total), placeholder home, `/terms`, `/privacy`. Review fixes: route gate let public files through, film strip kept inside the phone layout, Google button re-enabled after Back, profile actions pinned, links in `cobalt`, missing `--space-5` token replaced. Owner changes: `display-l` headings with `text-wrap: balance`, no-break spaces so "Chào mừng trở lại" only breaks as "Chào mừng / trở lại", more spacing, scribble removed from the profile screen, sign-up subtitle "Mỗi cuộn phim đều xứng đáng có một chỗ để nhớ." 306 tests, checked at 390 and 1440 px in both themes (25.09.2026)
- [x] **PR split (Trúc, 25.09.2026):** this branch (`feature/phase-0-setup`, Stages A–F) goes to `main` as its own PR. Stages G and H follow on a new branch and PR. Roadmap boxes to tick when this PR merges: `next-intl` with Vietnamese, Neon + Drizzle schema, Vercel deploy in `sin1`, Google sign-in (AUTH-1, after the phone sign-in check)
- [x] Stage C steps 12–13: `next-intl` 4.14.6 with `vi` only and no URL prefix, `messages/vi.json`; `theme` cookie → `data-theme` on `<html>`, `ThemeToggle` on `/dev/design-system`. 165 tests, `pnpm check` clean (25.09.2026)
- [x] Stage B step 9 remote: first preview deploy of `5e82787` is Ready in `sin1`; `/api/health` returns `{"ok":true,"db":"up"}` and Neon created the preview branch, both checked by Trúc (25.09.2026). The first push had been **blocked** by Vercel Hobby because commits were authored by `spartan-trucle`; this repo now commits as `Truc Le <97326103+NganTrucLe@users.noreply.github.com>`
- [x] PR split done: Stages A–F merged to `main` as PR #3; landing page as PR #2 (`main` at `689da35`, 25.09.2026)
- [x] Stage G merged as PR #5 (`b65c245`, 27.09.2026). Roadmap rev 27 ticks `next-intl`, Neon + Drizzle, Vercel `sin1`, PostHog; R2 buckets, Google sign-in and both spikes stay open until their checks below hold. Stage G on `feature/phase-0-storage-observability`: plan v5 below (G1–G5), approved by Trúc 25.09.2026 (OG font fetched from Google Fonts at render time, no font files, D31). G1–G4 done; PostHog browser + server errors confirmed in project `my-rolls` by Trúc and the test triggers removed (27.09.2026); step 24 done with four buckets (D35); G5: private-bucket smoke passes, public bucket waits on `R2_PUBLIC_URL` (r2.dev URL) and bucket CORS; spike notes in `docs/spikes/` wait for the device test on production
- [x] R2 public URL + CORS fixed and `pnpm r2:smoke` passes all steps; phone sign-in done (both Trúc, 27.09.2026). Roadmap rev 28 ticks "R2 buckets" and "Google sign-in"
- [x] Production unblocked by fast-forwarding `main` to owner-authored `ec20d20` (Trúc). Both spikes passed on production (Trúc, 27.09.2026), results in `docs/spikes/`; roadmap rev 29 ticks them. Story PNG is 3.1 MB: cache in R2 and try JPEG before Phase 4. Merge PRs with "Rebase and merge" so Vercel Hobby deploys them
- [x] Stage H step 29: exit check holds: phone sign-in on a preview URL (Trúc) and the story PNG renders "tấm ưng" (Trúc). Roadmap rev 30 ticks the Phase 0 exit (27.09.2026)
- [x] Stage H step 30: `/spike/*` removed (`google-font.ts` kept for Phase 4), README status updated, roadmap ticked (27.09.2026). **Phase 0 done.**
- [ ] **Open:** `.env.example` gets the `NEXT_PUBLIC_POSTHOG_*` and `R2_*` names (Trúc)
- [x] `.env.development.local` with the Neon `dev` branch URLs (D23, Trúc). `next dev` loads it ahead of `.env.local`; local `/api/health` returns `{"ok":true,"db":"up"}` (25.09.2026)

### Found during Stages A and B

- `next dev` in Next 16.3.6 appends an agent-rules block to `CLAUDE.md`; `main` already switches it off with `agentRules: false`.
- `src/env.ts` validated at import, which broke local builds once Development lost the database vars. Fixed: `getEnv()` validates on first use.
- Vercel Hobby only deploys commits whose author is the account's GitHub user (NganTrucLe). Keep the repo-local identity, and merge PRs into `main` so the head commit stays owner-authored (merge commit or rebase-merge from the GitHub UI as NganTrucLe).
- I didn't fetch `origin` at the start of the session and missed PR #1. Always `git fetch` before planning.
- Reading the `theme` cookie in the root layout (D21) makes every route dynamic. Fine while every Phase 0 page needs the session; for the landing page, switch to a small inline script that sets `data-theme` before paint so the page can be static again.
- `eslint-plugin-react-hooks` 7 (with `eslint-config-next` 16.3.6) errors on `setState` inside an effect. Read browser-owned values (`matchMedia`, cookies, `data-theme`) with `useSyncExternalStore`. jsdom has no `matchMedia`; `vitest.setup.ts` stubs it.
- The production domain is `my-rolls-weld.vercel.app`. Google redirect URIs: `localhost:3000`, production, and this branch's alias `my-rolls-git-feature-phase-0-setup-ngantrucles-projects.vercel.app`, so sign-in works on the preview before production runs the auth code that `oAuthProxy` relies on.
- Stage D review (25.09.2026, decided by Trúc): trusted origins narrowed to `https://my-rolls-*-ngantrucles-projects.vercel.app`; Better Auth's tables are an exception to the house DB rules (recorded in ADR-001); migration `0001` switches to `timestamptz` and indexes the auth lookups.
- **Launch gate (before any public custom domain):** a trusted origin receives `oAuthProxy`'s encrypted session hand-off, so production must stop trusting preview wildcards once it's reachable without Vercel login. Previews then sign in only on their registered branch aliases.
- Preview sign-in through `oAuthProxy` (any preview URL other than the registered branch alias) only works after production has deployed the auth code, i.e. after this branch is merged to `main`.
- `server-only` throws under Vitest, so `src/env.ts` dropped it. Put it back in Stage D with a Vitest alias to an empty module, before auth secrets live in code.
- `package.json` pins `pnpm@11.8.0`; check the first Vercel build uses a compatible pnpm.
- The dev branch password was pasted in chat and Neon branches share their parent's passwords, so it likely opens production too. No data yet; reset `neondb_owner` on both branches before the private beta.

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
| D22 | Error tracking | **No Sentry.** PostHog error tracking: `posthog-js` exception autocapture in the browser, `posthog-node` from `instrumentation.ts` `onRequestError` on the server | Trúc, 25.09.2026: no budget for Sentry. PostHog is already in the stack and has a free error-tracking tier, so one vendor fewer |
| D23 | Local database | Local dev must not use the production database. Before the first migration (step 14) you create a `dev` branch in the Neon console (Vercel → Storage → my-rolls-db → Open in Neon) and put its URL in `.env.development.local`, which Next.js reads ahead of `.env.local` and `vercel env pull` never overwrites | The integration gives Development the same database as Production |
| D24 | Preview branching | You switch it on: Vercel → Storage → my-rolls-db → connected project → Advanced Options → Deployments Configuration → Preview | The CLI install connected the database but can't show or set this; preview branch URLs are injected at deploy time, so `vercel env ls` can't confirm it |
| D25 | Neon Marketplace extras | The install also wrote `.agents/skills/neon*`, `.claude/skills/neon*` and `skills-lock.json`. **Your call:** keep and commit, or delete | Third-party skills that load into every Claude session in this repo; they cover Neon Auth, which we don't use |

## Who does what

Some steps need your accounts, logins or card. Claude never types passwords, card details or secrets, and secrets never go in the chat.

| Step | You | Claude (after your yes) | `fe-plan-executor` |
|---|---|---|---|
| Accounts | Install Vercel CLI + `vercel login` (done). Create Cloudflare account and complete R2 checkout. Confirm PostHog org | — | — |
| Vercel + Neon | Accept Neon Marketplace terms if asked | `vercel link`, region `sin1`, Git connect, `vercel integration add neon`, `vercel env pull` | — |
| Secrets | Paste Google and R2 secrets with `vercel env add` yourself; Neon dev branch URL into `.env.development.local` (D23) | Generate `BETTER_AUTH_SECRET` without printing it | — |
| Design inputs | — | Read each component's README from the design-system artifact; export the sample photos from the canvas | — |
| Code | Review PRs | Review agent output | Stages B–G code, tests first |
| Device checks | Sign in on phone; test Web Share in Zalo, Messenger, Instagram | — | — |

## Files to create or modify

All paths and names in English (D15).

```
.gitignore                               new     node_modules, .next, .env*.local, .vercel, tsbuildinfo
package.json, pnpm-lock.yaml             new     create-next-app (TS, App Router, src/, Tailwind v4, ESLint), Vitest
next.config.ts                           new     next-intl wrapper
vercel.json                              new     regions ["sin1"], build runs migrations
.env.example                             new     every required key, no values
src/env.ts                               new     typed env validation (zod)
src/app/api/health/route.ts              new     200 + DB ping

design-tokens/tokens.json                new     byte-for-byte copy of the artifact's tokens.json
scripts/build-tokens.ts                  new     `pnpm tokens` → src/styles/tokens.css
src/styles/tokens.css                    new     generated: Paper on :root, Darkroom on prefers-color-scheme + data-theme, Tailwind v4 @theme, Tailwind defaults off
src/app/fonts.ts                         new     next/font: Fraunces, Be Vietnam Pro, Space Mono, Patrick Hand, vietnamese subset
src/i18n/*, messages/vi.json             new     next-intl, vi only; keys in English (auth.signIn.title …)

src/design-system/components/*          exists  all nine components from PR #1 (Button, Field, Icon, Print, FilmStrip, Scribble, RollCard, Stamp, UploadDrop)

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
src/app/providers.tsx                    new     PostHog provider: pageviews + exception autocapture (D22)
instrumentation.ts, src/lib/posthog-server.ts new  server errors to PostHog via onRequestError (D22)
src/app/spike/og/route.tsx               new     1080×1920 story PNG with "tấm ưng" (Spike 1)
src/app/spike/share/page.tsx             new     Web Share with files (Spike 2)
tests/**                                 new     see Test strategy

docs/architecture/adr-001-tech-stack.md  modify  Accepted; user/account shape; email; oAuthProxy; r2.dev interim
docs/design/design-system.md             modify  sync to artifact `1790317950-ff46` ("In code" section)
docs/design/wireframes.md                modify  re-index canvas `1790318000-c9a4`: pages "Đăng nhập" and "Kệ & hồ sơ"; take Sign-in off the no-artboard list
docs/product/requirements/auth.md        modify  email decided; link the auth boards
docs/roadmap.md + roadmap artifact       modify  "PostHog + Sentry" → PostHog only (D22, with your OK); tick Phase 0 items as they land
README.md                                modify  status, how to run locally
```

## Implementation steps

Each step is at most half a day. A stage ends in a PR that deploys a preview.

### Stage A · Accounts, provisioning, doc sync (~2 h, no code)

1. **You:** install and log in to the Vercel CLI (done); create the Cloudflare account and complete R2 checkout; confirm the PostHog org.
2. **Claude:** docs, all in one commit:
   - Sync the design-system mirror to `1790317950-ff46`.
   - Re-index `wireframes.md` to canvas `1790318000-c9a4`.
   - Mark ADR-001 Accepted and fix its user/account shape (D5, D6).
   - Close the email issue in `auth.md`.
3. **Claude:** `vercel link` as project `my-rolls`, connect `NganTrucLe/my-rolls`, production branch `main`.
4. **Claude:** add Neon from the Marketplace with Singapore and preview branching on, then `vercel env pull .env.local`. Check that `DATABASE_URL` and `DATABASE_URL_UNPOOLED` exist (names only).
5. **Claude:** generate `BETTER_AUTH_SECRET` into Vercel for all three environments without echoing it.

### Stage B · App skeleton (~3 h)

6. Delete the stray untracked `node_modules/`, `.next/`, `next-env.d.ts`, `tsconfig.tsbuildinfo`. The `.gitignore` is already in place (added 25.09.2026); change its `.vercel/` line to `.vercel` and its `.env` + `.env.*` lines to one `.env*` line, keeping `!.env.example` after it, so `vercel env pull` stops appending to it. `create-next-app` refuses a folder that already holds `CLAUDE.md`, `docs/`, `.claude/` and `.planning/`, so scaffold it in the scratchpad (pnpm, TS, App Router, `src/`, Tailwind v4, ESLint) and copy the app files in, **keeping our `.gitignore` and `README.md`**. Add Vitest + Testing Library and the `test`, `lint`, `build` scripts.
7. `src/env.ts` validation, test first: missing key → clear error naming the key.
8. `/api/health`, test first: 200 with `{ ok, db }`; DB down → 503.
9. `vercel.json` with `sin1`; `.env.example`. First preview deploy; check the function region in the deploy output.

### Stage C · Tokens, fonts, language, theme (~1.5 h left; steps 10–11 done by PR #1)

10. Copy `tokens.json` byte for byte. Write the two tests first:
    - The generated CSS is out of date → fail.
    - Every text/ground contrast pair meets its target in both themes (4.5:1 for text; 3:1 for `line-strong` and `focus`).

    Then write `scripts/build-tokens.ts` → `src/styles/tokens.css`, with Tailwind's own colours, fonts, text sizes, radii and shadows switched off.
11. `next/font` for the four families with the `vietnamese` subset, wired to the `display` / `sans` / `mono` / `hand` token families.
12. `next-intl` with `vi` as the only locale, `messages/vi.json`, English keys. Test: a key with diacritics ("tấm ưng", "Đăng nhập bằng Google") renders as is.
13. Theme: `data-theme` on `<html>` from a cookie, system default. Tests first: no cookie → no attribute; cookie `dark` → `data-theme="dark"`. Then `ThemeToggle` with `aria-pressed` and the Vietnamese label from messages.

### Stage D · Database and Better Auth (~3 h)

14. **You:** create the Neon `dev` branch and put its URL in `.env.development.local` (D23). Then: Drizzle + Neon driver, `drizzle.config.ts`, Better Auth schema, first migration. The build runs `drizzle-kit migrate`. Check: a preview deploy creates its Neon branch, and the tables exist.
15. **You:** create the Google OAuth client. Redirect URIs: `http://localhost:3000/api/auth/callback/google` and the production callback URL. Add `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` with `vercel env add`.
16. Better Auth with Google, 30-day session, `oAuthProxy`, `newUserCallbackURL: /sign-up/profile`. Tests first:
    - The session lasts 30 days.
    - A new user gets name, email and avatar from the Google profile (mocked).
    - A new user is sent to `/sign-up/profile`; a returning user is sent to `/`.
17. `proxy.ts`: signed-out users hitting a protected route go to `/sign-in`, and signed-in users hitting `/sign-in` or `/sign-up` go home. Tests first. Sign-out action.

### Stage E · Design-system components (done by PR #1)

PR #1 ported all nine components to `src/design-system/components/` with tests and a showcase at `/dev/design-system`. Steps 18–19 below are kept for the record; Stage F checks the six it needs against the auth boards and fixes gaps there.

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
26. PostHog on the Cuộn project: provider with pageviews and exception autocapture in the browser; `posthog-node` capturing server errors from `onRequestError`. Check: one pageview, one browser error and one server error reach PostHog; the test error route is removed after.
27. Spike 1: `next/og` renders a 1080 × 1920 PNG with Be Vietnam Pro loaded from font files and "tấm ưng" on it. Test: 200, `image/png`, 1080 × 1920. You check the diacritics by eye.
28. Spike 2: a page that calls `navigator.canShare({ files })` and shares that PNG. You try it in iPhone Safari, Android Chrome, and the Zalo, Messenger and Instagram in-app browsers. Results go in a spike note (new doc; you decide where).

#### Stage G · detailed order (v5, 25.09.2026)

Branch `feature/phase-0-storage-observability` off `main` at `689da35` (PRs #1–#3 merged, Stage F included). R2 isn't provisioned yet (step 24 is yours), so the order is: everything that needs no R2 first, R2 code against unit tests, live R2 checks last.

| # | Decision | Default |
|---|---|---|
| D26 | PostHog in the browser | `instrumentation-client.ts` (Next 15.3+ convention, no provider component): `posthog.init` with `capture_pageview: "history_change"`, `capture_exceptions: true`, `person_profiles: "identified_only"`, no session recording. No reverse proxy yet (ad blockers will drop some events; fine for soft launch) |
| D27 | PostHog on the server | `posthog-node` in `src/lib/posthog-server.ts`; `instrumentation.ts` `onRequestError` awaits `captureExceptionImmediate` so the event is sent before the function returns (not `shutdown()`, which closes the reused client). Same public project token as the browser; no new secret |
| D28 | Who PostHog knows | No `identify` in Phase 0. Events stay anonymous; identifying signed-in users (by Better Auth `user.id`, never email) comes with Phase 1 onboarding events |
| D29 | Test error triggers | Under `/dev` (already public): `/dev/errors` page with a "throw in browser" button and a link to `/api/dev/boom`. Deleted in the last commit of this branch, after the PostHog check |
| D30 | Spike routes | `/spike/og` (route handler) and `/spike/share` (page), **public** in `proxy-decision.ts` and `noindex`. Deleted in Stage H once the spike note is written. Reason: Zalo, Messenger and Instagram in-app browsers have their own cookie jars, so they can't pass Vercel preview protection **or** Google sign-in (Google blocks OAuth in embedded webviews). The device test therefore runs on **production** `my-rolls-weld.vercel.app` after this PR merges |
| D31 | OG font | **No font files in the repo** (Trúc, 25.09.2026). Satori needs font bytes, not a CSS `@font-face` link, and can't read WOFF2 (the format `next/font` self-hosts). So the route fetches the Google Fonts CSS API (`css2?family=Be+Vietnam+Pro:wght@400;700&text=<exact text>`) with no browser user agent, which makes Google answer with TTF URLs; it then fetches those bytes and passes them to `ImageResponse`. `text=` subsets to the glyphs on the card. Font bytes memoised per text at module scope; the PNG response gets `Cache-Control: public, max-age=31536000, immutable`. The spike note records fetch time from `sin1` and what happens when Google is unreachable (route returns 503, no fallback font) |
| D32 | Upload content types | `image/jpeg`, `image/png`, `image/webp` only: the suggested default of roadmap decision 2 / [Known conflict #2](../../docs/README.md#known-conflicts-between-sources), which is still open (due 01.11). It's one constant; TIFF is added there if decision 2 goes the other way |
| D33 | Enforcing 10 MB on a presigned PUT | R2 has no presigned POST, so no `content-length-range`. The helper rejects `size > 10 MB` before signing **and** signs `ContentLength`, so R2 refuses a body of any other size |
| D35 | R2 environments | Prod buckets `my-rolls-originals` / `my-rolls-public` with their own token; Preview and Development share `my-rolls-dev-*` and a dev token (Trúc, 27.09.2026) |
| D34 | R2 client | `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`, endpoint `https://<account>.r2.cloudflarestorage.com`, region `auto`. PUT URLs expire in 10 min, GET in 5 min. Keys: `originals/<userId>/<uuid>.<ext>`. R2 env keys optional in `src/env.ts`, validated by a separate `getR2Env()` so the app still builds without them |

**G1 · PostHog (~1.5 h)** — step 26
- Tests first: `posthog-server` returns one memoised client; `onRequestError` captures the error with path + method and awaits `captureExceptionImmediate`; missing `NEXT_PUBLIC_POSTHOG_KEY` → no-op, no throw (local dev without the key must still run).
- `instrumentation-client.ts`, `instrumentation.ts`, `src/lib/posthog-server.ts`; `NEXT_PUBLIC_POSTHOG_*` added to `.env.example`.
- `/dev/errors` + `/api/dev/boom` (D29).
- **Check (Claude, with the PostHog MCP):** on the branch preview, one `$pageview`, one browser `$exception`, one server `$exception` land in the Cuộn project. Then delete the error triggers.

**G2 · Spike 1, story PNG (~1 h)** — step 27
- Tests first: `GET /spike/og` → 200, `content-type: image/png`, PNG header says 1080 × 1920 (read from the IHDR bytes, no image library); the font loader parses the TTF URL out of a sample Google CSS response and requests it with `text=`; Google unreachable → 503 (fetch mocked in all tests, no network).
- `src/app/spike/og/route.tsx` with `ImageResponse`, fonts from `src/lib/google-font.ts` (D31), a sample photo from `public/samples/`, the text "tấm ưng", "Cuộn phim đầu tiên", and a line with every Vietnamese tone mark on a, e, o, u, y (ả ạ ằ ẵ ặ ề ễ ệ ổ ỗ ộ ờ ợ ử ữ ự ỳ ỷ ỹ ỵ) so broken stacking is easy to spot.
- `/spike/*` public + `noindex` (D30), proxy tests updated first.
- **Check (you):** diacritics by eye on the preview.

**G3 · Spike 2, Web Share (~1 h)** — step 28
- Tests first (jsdom, `navigator.share`/`canShare` stubbed): button shows when `canShare({ files })` is true; falls back to a download link + "mở trong trình duyệt" hint when false or missing; an `AbortError` (user cancelled) shows nothing; other errors show the error name.
- `src/app/spike/share/page.tsx`: fetches `/spike/og` as a `File`, shows `navigator.userAgent`, `canShare` result, and the share outcome on screen so you can screenshot it per browser.
- `docs/spikes/web-share.md` and `docs/spikes/og-story-image.md` templates with a results table (browser × can share × shared to Instagram story × notes), linked from `docs/README.md`. **You** fill in the device results after merge (D30).

**G4 · R2 code (~1 h)** — step 25, unit-tested part
- Tests first: key shape `originals/<userId>/<uuid>.<ext>` with ext from content type; 10 MB + 1 byte → error naming the size; `image/tiff`, `image/gif` → rejected; signed URL has `X-Amz-Expires=600` and signs `content-length` (D33); `getR2Env()` names each missing key.
- `src/lib/r2.ts`, R2 keys in `.env.example`.

**G5 · R2 live (~0.5 h, after your step 24)**
- **You:** buckets, token, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_ORIGINALS`, `R2_BUCKET_PUBLIC`, `R2_PUBLIC_URL` with `vercel env add` (Production + Preview + Development) and into `.env.development.local`.
- **Claude:** bucket CORS (`PUT`, `GET` from `http://localhost:3000`, `https://my-rolls-weld.vercel.app`, `https://my-rolls-*-ngantrucles-projects.vercel.app` if R2 takes the wildcard, else the branch alias), then `scripts/r2-smoke.ts`: presign → PUT 1 KB → GET via `r2.dev` (public bucket) and presigned GET (private) → delete.
- If step 24 isn't done when G1–G4 are reviewed, the PR merges without G5 and G5 goes into Stage H's PR.
- **As built (27.09.2026, Trúc):** four buckets instead of two, and two tokens, so previews and local dev never touch real photos (D35):

  | Environment | `R2_BUCKET_ORIGINALS` | `R2_BUCKET_PUBLIC` | Token scoped to |
  |---|---|---|---|
  | Production | `my-rolls-originals` | `my-rolls-public` | the two prod buckets |
  | Preview + Development | `my-rolls-dev-originals` | `my-rolls-dev-public` | the two dev buckets |

  `R2_PUBLIC_URL` is the public bucket's `https://pub-<hash>.r2.dev` URL, never the `<account>.r2.cloudflarestorage.com` S3 endpoint (that one only takes signed requests). Object Read & Write tokens can't set CORS, so Trúc pastes the CORS JSON into each bucket's Settings. `scripts/r2-smoke.ts` refuses to run against buckets without `-dev-` unless given `--prod`.

**Risks added for Stage G**
- R2 has **no object versioning**, but [scans.md](../../docs/product/requirements/scans.md) wants originals restorable for 30 days. Not a Stage G problem; flag before Phase 2 (soft-delete + delayed purge instead).
- The story PNG depends on Google Fonts at render time: a Google outage or slow response breaks or slows the card. Fine for a spike; before Phase 3 sharing, decide whether to cache the rendered PNG in R2 (as the ADR already says) so the font fetch happens once per roll version.
- PostHog `capture_exceptions` in `posthog-js` needs a recent version; the agent checks current docs (Context7) and the installed version's types.
- The spike routes are public on production until Stage H deletes them. They show only a sample photo and fixed text.

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
- **Integration, run by hand:** a preview deploy creates a Neon branch and migrates it; the R2 smoke script; PostHog pageview and error test events.
- **Visual:** screenshots at 390 and 1440 px in both themes, next to the canvas boards.
- **Every PR:** `pnpm lint`, `pnpm test` and `pnpm build` pass locally, then on the Vercel preview.
- **On devices, by you:** the full sign-up and sign-in on a phone; Web Share in the five browsers.

## Risks

| Risk | Mitigation |
|---|---|
| ~17.5 h against 16 h booked | PR #1 took tokens, fonts and components off this plan; the rest uses ~1.5 h of the 30 h buffer |
| Google rejects the dynamic preview URLs | `oAuthProxy` (D8); only the production and localhost callbacks are registered |
| Preview protection blocks the phone | Sign in to Vercel on the phone (D9) |
| Neon's free plan caps branches, and preview branches are only deleted when their deployment expires (6 months by default) | Delete stale preview branches by hand; shorten deployment retention if the cap gets close |
| PostHog error tracking is younger than Sentry (weaker source maps, grouping) | Fine for one engineer at soft launch; revisit if errors get hard to read |
| A migration in the build breaks production | Phase 0 has only additive auth tables; revisit before Phase 1 |
| Next 16 / Tailwind v4 / Better Auth APIs differ from what the agent remembers | The agent checks current docs (Context7) before each stage |
| The canvas boards are wireframes, so code may drift from them | The PRD and design system win on conflicts; note any deliberate change in the PR |
| Terms and privacy are placeholders | They must be real before beta (D19); added to the content track |
| R2 CORS may not take wildcard origins | List the exact origins; add the branch alias as needed |
| `r2.dev` is rate-limited and not for production | Interim until the domain (D11) |
| Web Share with files fails in in-app browsers | That's what Spike 2 is for; the fallback is download + "mở trong trình duyệt" (roadmap risk) |
| The domain decision (11.10) forces config changes | Keep every URL in env; checklist: Google redirect URIs, `BETTER_AUTH_URL`, R2 domain, Vercel domain |
| Secrets leak into the chat or the repo | `.env*.local` gitignored; secrets entered only through `vercel env add` by you |
