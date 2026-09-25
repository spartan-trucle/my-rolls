# Collection & grid (COL) — core

> Two ways to look at everything: the beautiful view (film strip, shelf) and a grid for quick review.

Back to: [Requirements index](README.md) · [PRD overview](../prd.md) · Ships in: [Phase 3](../../roadmap.md#timeline-to-soft-launch) (COL-1–4), Phase 4 (COL-5), v1.1b, later

## Requirements

| ID | P | Requirement |
|---|---|---|
| COL-1 | P0 | Every roll has two views, switched with one control: "Dải phim" (the film strip, default) and "Lưới", a contact-sheet grid of all frames on dark cells, uncropped, with frame numbers and tấm ưng / oops badges. 3 columns on phones, 6 on desktop. The last view used is remembered. |
| COL-2 | P0 | Grid filters: Tất cả, Tấm ưng, Oops (and Tấm trắng for the owner), each with a count. Tapping a frame opens it large; swipe on phones or ← → on desktop moves to the next one. |
| COL-3 | P0 | The library has the same switch: "Kệ" (canister shelf) and "Lưới", every frame across all rolls grouped by roll, newest first, with the same filters. "Tấm ưng" across the whole library is the user's best-of. |
| COL-4 | P0 | Quick marking from the grid: select one or many frames (long-press on phones; click, Shift-click and K / O / B keys on desktop) and mark them tấm ưng, oops or blank in one action. |
| COL-5 | P0 | Friends get both views on a shared roll, with the same filters. Full-size download from the grid follows the owner's share setting (off by default). |
| COL-6 | P1 | Library grid filters by film, camera, lab and month, and jumps by year. |
| COL-7 | P2 | Pick frames from several rolls into a named collection ("Đà Lạt các năm") and share it as one link. |

## Flow

**Scans are back from the lab:** switch to Lưới, select the best frames and mark them tấm ưng in one go, then do the same for oops. Phase 3 exit: marking 36 frames takes under a minute on desktop.

## Build notes

- Library grid = one query over `frame` joined to `roll`, newest first. `user_id` is denormalised onto `frame` so an index on (`user_id`, `mark`, `created_at`) serves the library-wide tấm ưng view without a join ([ADR-001](../../architecture/adr-001-tech-stack.md#data-model-mvp)).
- Grid thumbnails use the 480 px WebP; the lightbox uses the 2048 px WebP; the original loads only at 100% zoom or on download ([scans](scans.md)).
- Keep "last view used" per user (COL-1). Local storage is enough for the MVP.

## Design

| Artboard | Shows |
|---|---|
| [`RollGrid` / `RollGridWeb`](../../design/wireframes.md#page-bộ-sưu-tập-collection) | One roll in grid view; select many, mark once (COL-1, COL-2, COL-4) |
| [`LibraryGrid` / `LibraryGridWeb`](../../design/wireframes.md#page-bộ-sưu-tập-collection) | Every frame of every roll (COL-3) |
| [`SharedGrid` / `SharedGridWeb`](../../design/wireframes.md#page-chia-sẻ--lab-sharing-and-labs) | Friend's grid view (COL-5) |

Components: `FilmStrip` for Dải phim (edge to edge on mobile, 150 px frames on phones), a straight `Print` grid with `tilt="none"`, and `Stamp` badges for keeper/oops ([design system](../../design/design-system.md#components)). Grids never tilt.

## Cut line

- Cut #2: library-wide grid (COL-3). Keep the grid inside each roll. Saves ~5 h.
- Cut #3: desktop shortcuts K / O / B and Shift-click (COL-4). Keep tap/click to select, then mark. Saves ~3 h.

## Open issues

- The COL-2 "Oops" filter depends on how oops is stored (see [notes open issues](notes.md#open-issues)).
