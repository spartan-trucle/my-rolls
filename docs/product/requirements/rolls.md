# Rolls (ROLL)

> The roll is the main object. Logging one must take under a minute.

Back to: [Requirements index](README.md) · [PRD overview](../prd.md) · Ships in: [Phase 1](../../roadmap.md#timeline-to-soft-launch) (ROLL-1, ROLL-2), v1.1a / v1.1b, later

## Requirements

| ID | P | Requirement |
|---|---|---|
| ROLL-1 | P0 | Create a roll with four required fields: film stock and camera, both picked from the bag first, plus box ISO and format, both prefilled from the film. Title, lens, exposures, shot-at ISO, dates and locations are optional. Push/pull is calculated in stops from box and shot-at ISO. |
| ROLL-2 | P0 | Add a past roll: the same form with dates in the past, followed straight away by uploading its scans. This is how a new user fills their shelf on day one. |
| ROLL-3 | P1 | Import many old rolls at once: pick several local folders or a Google Drive folder; each subfolder becomes a roll with its scans, details filled in afterwards. |
| ROLL-4 | P1 | Status steps: Loaded → Shot → At the lab → Scanned → Archived, each change timestamped. In the MVP a roll is either waiting for scans or has them. |
| ROLL-5 | P1 | Choose a cover frame (defaults to the first tấm ưng) and "Load the same again" to copy camera and film into a new roll. |
| ROLL-6 | P2 | Per-frame exposure log (shutter, aperture, lens) entered from the phone while shooting. |

Roll status steps (ROLL-4, v1.1):

| # | Status | Meaning |
|---|---|---|
| 01 | Loaded | in the camera |
| 02 | Shot | rewound, waiting |
| 03 | At the lab | dropped off |
| 04 | Scanned | scans uploaded |
| 05 | Archived | negatives filed |

## Flows

**Log a roll in under a minute:** tap "Cuộn mới" → pick the film from your bag (box ISO fills in) → pick the camera from your bag → save. The canister lands on your shelf.

**Add an old roll on day one:** tap "Thêm cuộn cũ" → pick film, camera and roughly when you shot it → drop the folder of scans the lab sent → mark a few tấm ưng. The shelf is no longer empty.

## Data

| Source | Shape |
|---|---|
| PRD | `Roll`: id, user_id, title, stock_id, camera_item_id, lens_item_ids[], format, exposures, box_iso, shot_iso, loaded_at, finished_at, locations[], cover_frame_id, memory, canister_color, canister_label, canister_photo_id |
| [ADR-001](../../architecture/adr-001-tech-stack.md#data-model-mvp) | `roll`: id, user_id, stock_id, camera_bag_item_id, lens_id?, number?, name, canister_color, box_iso?, shot_iso?, exposures?, format?, locations[]?, shot_from, shot_to, date_precision?, notes, memory, version |

`version` in the ADR drives share-image cache busting: any change to the roll bumps it ([share flow](../../architecture/adr-001-tech-stack.md#share-flow)).

## Metrics

- **Time to log a roll:** < 60 s median, from "Cuộn mới" to saved, for rolls picked from the bag. This is also the Phase 1 exit and a launch gate.
- **First shelf:** new users with at least one roll that has scans within 7 days of sign-up (ROLL-2 drives it).

## Design

No new-roll artboard yet ([wireframes](../../design/wireframes.md#mvp-screens-with-no-artboard-yet)). Components: `Field` (use `mono` for ISO), `RollCard`, `Button`. The mobile roll page reference is `RollPage` in the [design system](../../design/design-system.md#mobile).

## Open issues

- ~~The ADR `roll` table has no box ISO, shot-at ISO, exposures, format, lens or locations columns, yet ROLL-1 lists them as optional fields and computes push/pull from them. Settle the MVP columns before Phase 1.~~ **Resolved 27.09.2026 (Trúc), Known conflict #6:** [migration `0002`](../../../drizzle/0002_abnormal_ser_duncan.sql) adds nullable `box_iso`, `shot_iso`, `exposures`, `format`, `lens_id`, `locations text[]`. Push/pull stays computed (`pushPullStops()`), never stored.
- ~~PRD uses `camera_item_id` (a bag item); the ADR uses `camera_id` (the catalogue camera). This matters once one owner has two bodies of the same model.~~ **Resolved 27.09.2026 (Trúc), Phase 1 plan D2:** `roll.camera_bag_item_id` points at the bag item (the owner's specific body), not the catalogue `camera` row.
- ~~ROLL-1's "Để trống thì gọi là Cuộn #N" (audit N1) needs a stable per-user roll number.~~ **Resolved (Round 2, R2-5, migration `0003`):** `roll.number`, assigned once at creation (`MAX(number) + 1` per user, over every row so a number is never reused) and backfilled for pre-existing rows. The default "Cuộn #N" name is computed at display time from `number`, never stored in `name`.
- ~~ROLL-2's "roughly when" (audit P4) needs month, not day, precision, plus a "Không nhớ" empty state.~~ **Resolved (Round 2, R2-4, migration `0003`):** past mode accepts `{ month, year }` pairs (stored as that month's first/last instant in Vietnam time) alongside the existing exact `shotFrom`/`shotTo`, and a new `roll.date_precision` (`day` \| `month` \| `null`) says which the UI should render.
- PRD Q7 (rolls shot by two people) is deferred until after launch.
