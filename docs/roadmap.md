# Cuộn roadmap

> **Mirror — the artifact is the source of truth:** [Cuộn roadmap](https://claude.ai/artifact/Lsq7MWHNCVanpBWQ2D4XTo)
> Last synced: 27.09.2026 · doc revision 26 · by Claude for Trúc (revisions 16–23 by Trúc: waitlist page in Phase 1, landing page in Phase 5, 139 h build + 21 h buffer; revision 24 ticks "Repo, Next.js + Tailwind mapped to design tokens", landed in PR #1; revisions 25–26 remove the Phase 1 waitlist page at Trúc's request: sign-up stays open through the landing page).
> Before editing, re-read the artifact. Make changes in the artifact and copy them here in the same session (see [CLAUDE.md](../CLAUDE.md#sync-rules)).

Related: [PRD overview](product/prd.md) · [Requirements index](product/requirements/README.md) · [ADR-001](architecture/adr-001-tech-stack.md) · [Design system](design/design-system.md)

## Summary

Soft launch on **18.01.2027**. That is 16 weeks from now and about three weeks before Tết (6 Feb 2027), when Vietnamese shooters shoot and share the most.

- **Scope:** the 26 P0 requirements in [PRD v0.4](product/prd.md), on the stack in [ADR-001](architecture/adr-001-tech-stack.md), styled with the [design system](design/design-system.md).
- **Capacity:** one engineer at about 10 h/week, so 160 h. The plan books 139 h of build and keeps 21 h as buffer for day-job crunch weeks.
- **Shape:** six phases, each ending in something deployed and usable. Your own rolls go in from week 8.
- **After launch:** four weeks of fixing and measuring, then v1.1 in two drops (Feb–May), then Compare once enough lab data exists.

## Progress

Tick items as they land; a phase is done when its last item (the exit check) is ticked. Dates, hours and details are in the sections below. These boxes mirror the artifact: tick in both places (see [CLAUDE.md](../CLAUDE.md#sync-rules)).

### Phase 0 · Foundations (28 Sep – 11 Oct)

- [x] Repo, Next.js + Tailwind mapped to design tokens
- [ ] `next-intl` with Vietnamese
- [ ] Neon + Drizzle schema
- [ ] R2 buckets (private originals, public derivatives)
- [ ] Vercel deploy in `sin1`
- [ ] PostHog for analytics and errors
- [ ] Google sign-in ([AUTH-1](product/requirements/auth.md))
- [ ] Spike: `next/og` with Be Vietnam Pro
- [ ] Spike: Web Share with files on iPhone and in Zalo, Messenger, Instagram
- [ ] Exit: sign in on a phone on a preview URL; a test story PNG renders "tấm ưng" correctly

### Phase 1 · Log a roll (12 Oct – 1 Nov)

- [ ] Seeded catalogue + accent-free search ([CAT-1](product/requirements/catalogue.md))
- [ ] Custom stock or camera ([CAT-2](product/requirements/catalogue.md))
- [ ] Bag ([BAG-1](product/requirements/bag.md))
- [ ] New roll ([ROLL-1](product/requirements/rolls.md))
- [ ] Past roll ([ROLL-2](product/requirements/rolls.md))
- [ ] Lab directory ([LAB-1](product/requirements/labs.md))
- [ ] Custom lab ([LAB-2](product/requirements/labs.md))
- [ ] Exit: a roll is logged from the bag in under 60 s on a phone

### Phase 2 · Scans & notes (2 – 22 Nov)

- [ ] Presigned upload, 10 MB cap ([SCAN-1](product/requirements/scans.md))
- [ ] Bulk upload with per-file retry ([SCAN-2](product/requirements/scans.md))
- [ ] Browser-made WebP copies + nightly cleanup ([SCAN-3](product/requirements/scans.md))
- [ ] Tấm ưng / blank marks ([SCAN-4](product/requirements/scans.md))
- [ ] Scan set with lab + branch ([LAB-3](product/requirements/labs.md))
- [ ] Notes and memory ([NOTE-1](product/requirements/notes.md))
- [ ] Mistakes ([NOTE-2](product/requirements/notes.md))
- [ ] M1 dogfood: 5 of your real rolls uploaded, 0 failed files

### Phase 3 · Shelf & collection (23 Nov – 13 Dec)

- [ ] Canister shelf ([CAN-1](product/requirements/canister.md))
- [ ] Drawn canister ([CAN-2](product/requirements/canister.md))
- [ ] Film strip / grid switch ([COL-1](product/requirements/collection.md))
- [ ] Filters + lightbox ([COL-2](product/requirements/collection.md))
- [ ] Library grid ([COL-3](product/requirements/collection.md))
- [ ] Bulk marking ([COL-4](product/requirements/collection.md))
- [ ] Exit: the shelf shows every roll; marking 36 frames takes under a minute on desktop

### Phase 4 · Sharing (14 Dec – 3 Jan)

- [ ] Share link + revoke ([SHARE-1](product/requirements/sharing.md))
- [ ] Friend view ([SHARE-2](product/requirements/sharing.md))
- [ ] Friend grid view ([COL-5](product/requirements/collection.md))
- [ ] Link preview ([SHARE-3](product/requirements/sharing.md))
- [ ] Story cards Dải phim + Phiếu cuộn ([SHARE-4](product/requirements/sharing.md))
- [ ] North-star events in PostHog
- [ ] M2 feature complete: a link pasted in Zalo and Messenger shows the cover; a story posts to Instagram from iPhone and Android

### Phase 5 · Private beta (4 – 17 Jan)

- [ ] Speed pass
- [ ] Keyboard and alt text
- [ ] Vietnamese copy pass
- [ ] Fixes from 10–15 beta shooters
- [ ] Landing page from the designs, phone + desktop, with real shelf, film strip and story card screenshots
- [ ] Exit: every launch gate in [Soft launch](#soft-launch) holds on 15 Jan

### Content track

- [ ] Name and domain chosen
- [ ] Catalogue seeded
- [ ] Labs checked
- [ ] Canister and camera photos matched
- [ ] Beta list of 10–15 shooters
- [ ] Vietnamese copy reviewed by 2 shooters
- [ ] Launch posts ready

### Decisions

- [ ] 1. Name and domain
- [ ] 2. File types and size (edit SCAN-1, SCAN-3)
- [ ] 3. GPS on downloads
- [ ] 4. Lab listing accuracy
- [ ] 5. Brand logos in canister photos
- [ ] 6. Storage while free
- [ ] 7. Who reviews submissions
- [ ] 8. Rolls shot by two people

## How the order was chosen

1. **Build the loop in the order a user meets it:** sign in → log a roll → upload scans → look at them → share. Every phase ends on a working slice on a preview URL.
2. **Use it yourself from week 8.** Your real rolls fill the shelf you show at launch and find the bugs before beta users do.
3. **Protect the growth engine.** Sharing drives the north star (link opens by non-users), so it gets a full phase and is never what gets cut.
4. **Spike the risky tech in weeks 1–2:** Vietnamese diacritics in `next/og` images, and Web Share with image files on iPhone and inside Zalo, Messenger and Instagram.
5. **Run content in parallel.** Catalogue, lab and canister data are not code, but they take calendar time.

## Timeline to soft launch

Six phases, 28 Sep 2026 – 17 Jan 2027. Hours are build estimates; the 21 h buffer sits on top.

| Phase | Weeks · dates | Build hours | What ships (PRD IDs) | Done when |
|---|---|---|---|---|
| 0. Foundations | W1–2 · 28 Sep – 11 Oct | 16 | Repo, Next.js + Tailwind mapped to design tokens, `next-intl` (vi), Neon + Drizzle schema, R2 buckets, Vercel `sin1`, PostHog for analytics and errors, Google sign-in ([AUTH-1](product/requirements/auth.md)). Spikes: `next/og` with Be Vietnam Pro, Web Share with files | You sign in on a phone on a preview URL, and a test story PNG renders "tấm ưng" correctly |
| 1. Log a roll | W3–5 · 12 Oct – 1 Nov | 27 | Seeded catalogue + accent-free search ([CAT-1](product/requirements/catalogue.md)), custom stock/camera (CAT-2), bag ([BAG-1](product/requirements/bag.md)), new and past roll ([ROLL-1, ROLL-2](product/requirements/rolls.md)), lab directory + custom lab ([LAB-1, LAB-2](product/requirements/labs.md)) | A roll is logged from the bag in under 60 s on a phone |
| 2. Scans & notes | W6–8 · 2 – 22 Nov | 26 | Presigned upload, bulk upload, browser-made WebP copies, nightly cleanup ([SCAN-1–3](product/requirements/scans.md)), scan set with lab + branch (LAB-3), tấm ưng / blank (SCAN-4), notes, memory, mistakes ([NOTE-1, NOTE-2](product/requirements/notes.md)) | **M1 — dogfood:** 5 of your real rolls uploaded, 0 failed files |
| 3. Shelf & collection | W9–11 · 23 Nov – 13 Dec | 24 | Canister shelf + drawn canister ([CAN-1, CAN-2](product/requirements/canister.md)), film strip / grid switch, filters, lightbox ([COL-1, COL-2](product/requirements/collection.md)), library grid (COL-3), bulk marking (COL-4) | Your shelf shows every roll; marking 36 frames takes under a minute on desktop |
| 4. Sharing | W12–14 · 14 Dec – 3 Jan | 26 | Share link + revoke ([SHARE-1](product/requirements/sharing.md)), friend view in both views (SHARE-2, COL-5), link preview (SHARE-3), story cards Dải phim + Phiếu cuộn (SHARE-4), north-star events in PostHog | **M2 — feature complete:** a link pasted in Zalo and Messenger shows the cover; a story posts to Instagram from iPhone and Android |
| 5. Private beta | W15–16 · 4 – 17 Jan | 20 | Landing page (phone + desktop, real screenshots), speed pass, keyboard and alt text, Vietnamese copy pass, fixes from 10–15 beta shooters | Launch gates met (see [Soft launch](#soft-launch)) |

Phase 4 runs over Christmas and New Year, which is why most of the buffer is expected to go there.

## Content track (runs alongside)

About 2 h/week of data and writing work. Film friends can take much of it.

| Item | Needed by | Blocks |
|---|---|---|
| Name and domain chosen (cuon.app, cuon.vn or similar) | 11.10.2026 | Phase 0 deploy, share links |
| Catalogue: every stock sold at 3–4 big Vietnamese film shops, plus the common cameras here | 01.11.2026 | CAT-1, Phase 1 exit |
| Labs: LLAB, Croplab, Cinephile branches checked; "47+" identified; more labs in TP.HCM, Hà Nội, Đà Nẵng, Đà Lạt | 01.11.2026 | LAB-1 |
| Recaptured canister and camera photos matched to catalogue entries | 23.11.2026 | CAN-2, Phase 3 |
| Beta list: 10–15 shooters on both iPhone and Android, using at least 4 different labs | 14.12.2026 | Phase 5 |
| Vietnamese copy file reviewed by 2 shooters | 04.01.2027 | Phase 5 |
| Launch posts: your own rolls shared as stories, short intro for film groups and labs | 11.01.2027 | Soft launch |

## Decisions due

Each open question has a date after which it blocks work. The PRD and ADR also disagree in two places (rows 2 and 3); both need a PRD edit before Phase 2.

| # | Decision | Decide by | Suggested default |
|---|---|---|---|
| 1 | Name and domain (PRD Q6) | 11.10.2026 | Take whichever of cuon.app / cuon.vn is free |
| 2 | File types and size (PRD Q2). PRD SCAN-1/3 accept TIFF with server-made copies; ADR makes copies in the browser, JPEG/PNG only | 01.11.2026 | MVP: JPEG, PNG, WebP up to 10 MB. TIFF and the server path in v1.1a. Update SCAN-1 and SCAN-3 |
| 3 | GPS on downloads. SHARE-1 says no file served carries GPS, but a full-size download is the original, byte for byte | 01.11.2026 | No download toggle in the MVP. When share settings (SHARE-6) ship, serve a GPS-stripped copy |
| 4 | Lab listing accuracy (PRD Q3) | 01.11.2026 | Launch with checked labs only; district and city, no services |
| 5 | Brand logos in canister photos (PRD Q5) | 23.11.2026 | Keep as reference photos; drawn canisters stay unbranded |
| 6 | Storage while free (PRD Q1) | 04.01.2027 | Soft cap of 30 rolls (~9 GB) per account, raised on request; R2 billing alert at $10/month. Revisit before bulk import |
| 7 | Who reviews submissions (PRD Q4) | 22.03.2027 | You, weekly; auto-approve contributors with 3+ approved entries |
| 8 | Rolls shot by two people (PRD Q6) | After launch | Wait for real requests; collections (COL-7) may cover it |

## Cut line

If any phase ends more than a week late, cut in this order. Each cut moves to v1.1a, not away.

| Order | Cut | Keep instead | Saves |
|---|---|---|---|
| 1 | Phiếu cuộn story card | Dải phim card only | ~5 h |
| 2 | Library-wide grid (COL-3) | Grid inside each roll | ~5 h |
| 3 | Desktop shortcuts K / O / B and Shift-click (COL-4) | Tap or click to select, then mark | ~3 h |
| 4 | Free colour picker on the canister (CAN-2) | The 8 preset colours | ~2 h |

Never cut: share link, friend view, link preview, one story card, upload reliability, or the phone and desktop layouts. If still behind on 4 Jan, move launch to 25 Jan, still 12 days before Tết, rather than cut sharing.

## Soft launch

Launch goes ahead on 18 Jan only if every gate below holds on **15.01.2027**.

- [ ] 10+ beta users have at least one roll with scans ("first shelf")
- [ ] Median time to log a roll under 60 s
- [ ] Upload failures under 1%, excluding files over the size limit
- [ ] First row of thumbnails under 2 s on 4G, checked on a real mid-range Android phone
- [ ] Story card posts from iPhone Safari and Android Chrome; link preview shows in Zalo, Messenger and Facebook
- [ ] No open bug that loses data or breaks a share link

**Launch week:** post your own shared rolls in Vietnamese film Facebook groups and on Instagram, and ask LLAB, Croplab and Cinephile to reshare. Frame it around Tết: shoot a roll over Tết and put it on your kệ.

**Weeks 1–4 after launch (18 Jan – 14 Feb):** no new features. Fix what breaks, set baselines for the six PRD metrics, and talk to 5 users a week.

## After launch

v1.1 ships in two drops ordered by the metrics they move; Compare waits until there is enough lab data to compare.

| Release | When | What ships (PRD IDs) | Why now |
|---|---|---|---|
| v1.1a — Fill the shelf, share more | 15 Feb – 21 Mar 2027 (5 wks) | Bulk import of old rolls (ROLL-3), resumable uploads + duplicate skip (SCAN-5), TIFF + server-made copies, Ảnh dán and Oops cards (SHARE-5), share settings + expiry (SHARE-6), cover frame + "load the same again" (ROLL-5), delete account (AUTH-2), anything cut from the MVP | Moves "first shelf" and the north star directly |
| v1.1b — Community and bag | 22 Mar – 2 May 2027 (6 wks) | Submissions + one review queue (CAT-3, CAT-4), film pocket and camera cards (BAG-2, BAG-3), roll status (ROLL-4), rescans (LAB-4), private lab ratings (LAB-5), library filters (COL-6), note search (NOTE-3), mistake summaries (NOTE-4) | Lets Vietnamese shooters grow the catalogue and labs themselves |
| v1.2 — Compare | May – Jun 2027 | Library filters by lab and process (CMP-1), side by side (CMP-2), split slider (CMP-3) | Starts only when 200+ scan sets exist and 60%+ have lab and branch |
| Later (P2) | H2 2027 | Colour profiles and lab/stock views (CMP-4–6), collections (COL-7), comments and reactions (SHARE-7), Drive/WeTransfer import (SCAN-6), exposure log (ROLL-6), bag card (BAG-4), pooled mistake stats (CAT-5), pinned notes (NOTE-5) | Pick from what users ask for most after v1.1 |

Review this roadmap at the end of each phase and after the four-week stabilise window.

## Risks

The two biggest risks are your own time and phone share sheets inside in-app browsers; both are tackled in the first two weeks.

| Risk | Likelihood | Mitigation |
|---|---|---|
| Day-job crunch takes whole weeks | High | 21 h buffer, the cut line, launch slips by one week at most |
| Web Share with files fails inside Zalo, Messenger or Instagram in-app browsers | High | Test in Phase 0; detect it, offer "mở trong trình duyệt", fall back to download |
| Vietnamese diacritics render wrong in `next/og` images | Medium | Load Be Vietnam Pro font files into the renderer; spike in Phase 0 |
| Zalo or Facebook keep an old preview image | Medium | Versioned `og:image` URL per roll version; test in Phase 4 |
| Catalogue or lab data not ready | Medium | Start in week 1; launch with fewer, checked entries; custom entries fill gaps |
| R2 free 10 GB fills at about 33 rolls | Certain | Budget ~$5/month from launch; billing alert |
| Neon cold start slows the first share-page open | Medium | Cache share pages; measure during beta |
| Filmer adds web sharing | Low | Lean on what it lacks: Vietnamese first, local labs, story cards, the shelf |
