# Cuộn PRD (MVP) — overview

> **Source:** [Cuộn PRD v0.4](https://claude.ai/artifact/9rfAShmDJUP9uFaDLikmu8) · Draft for review · Owner Trúc Lê · updated 27.09.2026 (artifact version 6: BAG-2 and BAG-3 raised to P0)
> This page summarises the PRD. The requirement-level detail lives in the [deep-dives](requirements/README.md). When the wording here and the artifact differ, the artifact wins.

Related: [Roadmap](../roadmap.md) · [ADR-001](../architecture/adr-001-tech-stack.md) · [Design system](../design/design-system.md) · [Wireframes](../design/wireframes.md)

Cuộn (Vietnamese for "roll") is a home for film rolls, made for Vietnamese film shooters and free to use. You log a roll from your bag in under a minute, keep it as a canister on your shelf, and share it as a story card and a link friends open without an account. Compare rolls and labs once there is enough data.

**Scope:** 55 requirements, 28 of them must-haves (P0) for the MVP.

## Summary

Film shooters go through many rolls. The facts that explain how a roll looks (stock, camera, push/pull, which lab and branch developed it) end up scattered or forgotten. Sharing a roll means sending a Drive link. When two rolls of the same stock come back looking different, there is no easy way to see why.

Cuộn gives every roll one page: its scans at full size; its film, camera and lab; its mistakes and notes; and the memory behind it. Your bag holds your cameras and film, so logging takes two taps. Each roll sits on your shelf as a canister you colour and label yourself, or as a real canister photo from the catalogue. Any roll becomes a story card and a link friends open without an account.

The north star is share links opened by people who don't use Cuộn yet. The MVP is built around it:

- fast logging (new and past rolls)
- the bag, a seeded catalogue and a lab directory
- full-size upload
- the canister shelf
- the friend view and two story cards

Every scan set records its lab and branch from day one, so Compare can ship later with real data behind it. Cuộn is free, and every screen is designed for phone and desktop.

## Problem

| Problem | What happens today |
|---|---|
| A roll's details end up in four places | Stock and camera in a notes app, lab details in a message, scans in a Drive link, favourites on Instagram. Months later nobody remembers which camera or lab made a roll. |
| Comparing rolls and labs is guesswork | To compare two labs, a shooter opens two folders in two windows and flips between them. Scanner, push/pull and branch are rarely written down, so a colour difference can't be explained. |
| Mistakes repeat | Light leaks, wrong ISO and missed focus are noticed once and forgotten. Nothing links a mistake to the camera or lab that caused it. |
| Sharing means a Drive link | Friends get a folder link, instead of a roll they can browse on a phone with the story behind it. |

## Goals & non-goals

| Goal | Meaning |
|---|---|
| One home per roll | Stock, camera, lab, scans, mistakes, notes and the story behind the roll live together, so nothing depends on a lab email or a notes app. |
| Rolls worth sharing | Every roll becomes a story card and a link friends open without an account. Sharing should feel like showing off a scrapbook, not sending a zip file. |
| A shelf and a collection | Every roll is a canister on your shelf, coloured and labelled by you. Switch to the grid to review a roll in seconds, or see every frame you've ever shot. |
| Log a roll in under a minute | Your bag holds your cameras and film, so a new roll is two taps: pick the film, pick the camera. |
| Compare, once there is data | Put two rolls, two labs or two frames side by side with the settings that differ highlighted. |
| Keep scans at full size | The file the lab sent is stored as it was sent, up to 10 MB per frame. Smaller copies are made for browsing; the original is never touched. |
| Vietnamese first | Vietnamese copy, local labs and the stocks sold here, search that works without accents. |
| Free to use | No charge for logging rolls, customising canisters or sharing. No paid tier at soft launch. |

**Not in scope:**

- Editing, filters, presets or negative inversion. Cuộn shows scans as the lab delivered them.
- A public feed, followers or discovery. Every roll is private unless its owner shares a link.
- Public ratings of labs. Ratings stay private to the person who gave them.
- Ordering or paying for development through a lab.
- A native iOS or Android app. The web app works on phones and desktop, and can be added to the home screen.
- RAW files and camera-scan workflows in v1.
- Charging users during the soft launch. Storage is the one cost to watch, not a feature to sell.

## Who it's for

| Persona | Profile | Need | In their words |
|---|---|---|---|
| The regular shooter | Sài Gòn · 35mm + 120 · 2–4 rolls a month | Remember which camera, stock and lab made each roll, and stop repeating the same mistakes | "máy nào lọt sáng nữa vậy??" |
| The lab hopper | Same stock · 3 labs tried this year | See side by side which lab's scans look the way they like | "lab này xanh quá?" |
| The friend | No account · opens links on the phone | Is in the photos or was on the trip; opens the roll from Zalo or Messenger and maybe saves a frame | "gửi tui tấm 12 nha" |

## North star & MVP

**North star:** share links opened by people who don't use Cuộn yet, counted weekly. Cuộn grows when a friend opens a roll and wants a shelf of their own. Everything in the MVP either gets a roll onto the shelf fast or makes it worth sharing.

Why the MVP is shaped this way:

- **Roll one has to pay off.** The shelf, the canister and a story card are worth something on the first roll. Compare only pays off once someone has the same stock back from two labs, which takes months.
- **Collect the data now, compare later.** Every scan set records its lab and branch from day one.
- **Seed it ourselves first.** The team seeds stocks, cameras, canister photos and labs before launch. Community submissions and the review queue wait for v1.1, so launch doesn't start with a moderation job.
- **Two versions of every screen.** Phone (390 px) and desktop (1440 px). Story cards are the exception: fixed 1080 × 1920 images.

26 must-have requirements in the MVP, down from 32 in v0.2.

## Requirement areas

Each area has a deep-dive with its requirements, flows, data, designs and open issues. Full ID index: [requirements/README.md](requirements/README.md).

| Area | Deep-dive | P0 / P1 / P2 | Core |
|---|---|---|---|
| Sign-in | [auth.md](requirements/auth.md) | 1 / 1 / 0 | |
| Rolls | [rolls.md](requirements/rolls.md) | 2 / 3 / 1 | |
| Bag (Túi) | [bag.md](requirements/bag.md) | 3 / 0 / 1 | ✓ |
| Catalogue | [catalogue.md](requirements/catalogue.md) | 2 / 2 / 1 | |
| Labs | [labs.md](requirements/labs.md) | 3 / 2 / 0 | |
| Scans & storage | [scans.md](requirements/scans.md) | 4 / 1 / 1 | |
| Notes & mistakes | [notes.md](requirements/notes.md) | 2 / 2 / 1 | |
| Canister shelf | [canister.md](requirements/canister.md) | 2 / 0 / 0 | ✓ |
| Collection & grid | [collection.md](requirements/collection.md) | 5 / 1 / 1 | ✓ |
| Sharing | [sharing.md](requirements/sharing.md) | 4 / 2 / 1 | ✓ |
| Compare | [compare.md](requirements/compare.md) | 0 / 3 / 3 | |

## Key flows

| Flow | Steps | Areas |
|---|---|---|
| Log a roll in under a minute | Tap "Cuộn mới" → pick the film from your bag (box ISO fills in) → pick the camera from your bag → save; the canister lands on your shelf | [rolls](requirements/rolls.md), [bag](requirements/bag.md) |
| Add an old roll on day one | Tap "Thêm cuộn cũ" → pick film, camera and roughly when you shot it → drop the folder of scans → mark a few tấm ưng | [rolls](requirements/rolls.md), [scans](requirements/scans.md) |
| Scans are back from the lab | Open the roll, drop the lab's folder on it → pick lab and branch → switch to Lưới, select the best frames and mark them tấm ưng in one go (same for oops) → write the memory | [scans](requirements/scans.md), [labs](requirements/labs.md), [collection](requirements/collection.md), [notes](requirements/notes.md) |
| My lab isn't listed | Search the lab picker; nothing matches → tap "Thêm lab mới" → fill in name, address, city and services → save; it's usable straight away | [labs](requirements/labs.md) |
| Make the roll yours | Open the roll's canister → use the catalogue photo, or pick a colour close to the real canister → write the roll name on the label → it joins the shelf | [canister](requirements/canister.md) |
| Share a roll to your story | Tap "Chia sẻ cuộn này" → pick Dải phim or Phiếu cuộn → "Đăng lên story", pick Instagram, add the link sticker → friends tap and open the roll without signing up | [sharing](requirements/sharing.md) |

## Data model (PRD view)

A roll can have several scan sets, and each scan set has its own lab record. That split is what makes lab comparison and rescans possible.

| Entity | Main fields |
|---|---|
| User | id, google_sub, email, display_name, avatar_url, created_at |
| Stock | id, brand, name, iso, type, format[], owner_id (null = catalogue), status (private \| pending \| approved), canister_photo_id |
| CameraModel | id, brand, model, type, format, owner_id, status, photo_id |
| BagItem | id, user_id, kind (camera \| lens \| stock), ref_id, nickname, qty, expiry_year, notes |
| Lab | id, name, owner_id, status, website, services[], accepts_mail |
| LabBranch | id, lab_id, name, district, city, address, map_url |
| Roll | id, user_id, title, stock_id, camera_item_id, lens_item_ids[], format, exposures, box_iso, shot_iso, loaded_at, finished_at, locations[], cover_frame_id, memory, canister_color, canister_label, canister_photo_id |
| ScanSet | id, roll_id, lab_branch_id, received_at, dropped_at, process, push_pull, scanner, resolution_px, file_format, price_vnd, ratings{} |
| Frame | id, scan_set_id, number, original_key, bytes, width, height, sha256, icc_profile, derived_keys{}, is_keeper, is_blank, alt_text |
| Mistake / Note | id, roll_id \| frame_id, type (mistake only), body, created_at, edited_at |
| CatalogPhoto | id, kind (canister \| camera), stock_id \| camera_model_id, uploader_id, original_key, status, reviewed_by, reviewed_at |
| ShareLink | id, roll_id, token_hash, show_notes, show_memory, show_mistakes, allow_download, expires_at, revoked_at, view_count, opens_by_non_users |

Relations: User 1—n Roll · Roll 1—n ScanSet · ScanSet 1—n Frame · ScanSet n—1 Lab · Roll n—1 Camera, Stock · Roll 1—n ShareLink.

> The MVP tables in [ADR-001](../architecture/adr-001-tech-stack.md#data-model-mvp) are a subset of this model and differ in places (mistakes, token hashing). See [Known conflicts](../README.md#known-conflicts-between-sources).

## Non-functional requirements

| Topic | Requirement |
|---|---|
| Web and mobile | Every screen designed and built for phone (390 px) and desktop (1440 px). Touch targets ≥ 44 px; primary actions at the bottom on phones. |
| Language | Vietnamese first; English later from the same message files. VND, dd.mm.yyyy dates. Text fields and search handle diacritics; search works without accents. |
| File size | 10 MB per image, checked in the browser before upload and again on the server. |
| Originals | Private object storage, served only through short-lived signed URLs. Versioned so a deleted file can be restored for 30 days. |
| Colour | Originals keep their embedded ICC profile. Browsing copies are converted to sRGB so Adobe RGB and sRGB labs compare fairly. |
| Speed | First row of thumbnails on a roll page < 2 s on 4G. A 36-frame upload keeps going while the user moves around. A story card is ready < 3 s. |
| Privacy | Rolls private by default. Only the owner and holders of an active share link can see a roll. Lab ratings are never public. |
| Access | Every frame has alt text (default "Tấm 12"). Every flow works with a keyboard on desktop. |

### Words we use

| In docs | In the app |
|---|---|
| roll | cuộn |
| keeper | tấm ưng |
| oops | oops |
| bag | túi |
| shelf | kệ |
| canister | vỏ cuộn |
| lab | lab |
| memory | kỷ niệm |

## Success metrics

Most targets are set after a month of real data. Two are design limits held from day one.

| Metric | Target | Definition |
|---|---|---|
| North star | Baseline in month 1 | Share links opened by people who don't use Cuộn yet, per week |
| Time to log a roll | < 60 s median | From "Cuộn mới" to saved, for rolls picked from the bag |
| First shelf | Baseline in month 1 | New users with at least one roll that has scans within 7 days of signing up |
| Shared rolls | Baseline in month 1 | Rolls with scans that get a share link or a story card |
| Lab recorded | Baseline in month 1 | Scan sets with lab and branch; Compare depends on it |
| Upload failures | < 1% | Files that fail after retries, excluding files over the size limit |

## Release plan

| Release | Priority | Contents |
|---|---|---|
| MVP | All P0 | Google sign-in · new and past rolls, bag-first picker · bag, seeded catalogue, custom stocks and cameras · film pocket counts and camera cards · lab directory with branches, custom labs · full-size upload, tấm ưng, oops, notes, memory · canister shelf · film strip and grid views for rolls, library and friends · share link, friend view, link preview · story cards Dải phim, Phiếu cuộn |
| v1.1 | P1 | Story cards Ảnh dán, Oops · community submissions with one review queue · import many old rolls · Compare: filters, side by side, slider · share settings and link expiry · roll status steps, rescans |
| Later | P2 | Colour profiles and lab/stock views · pooled mistake stats per camera · comments, reactions, collections · import from Drive / WeTransfer · per-frame exposure log · bag share card |

Dates and the v1.1a / v1.1b / v1.2 split are in the [roadmap](../roadmap.md#after-launch).

## Open questions

Dates and suggested defaults for each are in the [roadmap's Decisions due](../roadmap.md#decisions-due).

| # | Question | Detail |
|---|---|---|
| Q1 | Storage while free | Importing 20 old rolls brings about 6 GB. What cap per account keeps the soft launch affordable, worded so it never feels like a paywall? |
| Q2 | Is 10 MB enough? | Lab JPEGs fit, but a 35mm TIFF is often 20–60 MB. Keep the cap, raise it for TIFF only, or decide later? |
| Q3 | Lab listings | Branches move and addresses differ between sources; most labs' services are unverified. District and city only, and later let labs claim their listing? "47+" still needs identifying. |
| Q4 | Who reviews submissions | When submissions open in v1.1, who reviews and how fast? Consider auto-approving users with 3+ approved entries. |
| Q5 | Brand logos in photos | Catalogue canister photos show real logos. Fine as reference photos; the drawn canister stays unbranded. |
| Q6 | Name and domain | "Cuộn" needs a plain spelling for URLs ("cuon"). Check cuon.app, cuon.vn or similar. |
| Q7 | Shared rolls | Two friends shot on two cameras on one trip: one roll with two owners, or two rolls in a collection? |

## Technical notes from the PRD

The PRD offers these as suggestions, not requirements. [ADR-001](../architecture/adr-001-tech-stack.md) is the decision and changes some of them. For example, it makes browsing copies in the browser, not in a server queue.

- Google sign-in via OpenID Connect; store only the Google subject ID and profile fields.
- Browser uploads straight to object storage with presigned URLs (multipart for resume). The API only records metadata.
- A queue job per frame makes the browsing copies (libvips), computes the file hash and strips GPS from viewer copies.
- Story cards and link-preview images are rendered on the server from the roll's data (HTML to PNG) and cached per roll and template.
- On phones, "Đăng lên story" uses the Web Share API with the PNG file; where unsupported it falls back to download.
- Postgres for all records. Share tokens are stored hashed; the plain token only exists in the link. Catalogue, labs and user entries share one status field, so one review queue covers them all.
