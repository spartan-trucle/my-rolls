# Bag · Túi (BAG) — core

> What I own. It makes logging fast and gives the app some personality.

Back to: [Requirements index](README.md) · [PRD overview](../prd.md) · Ships in: [Phase 1](../../roadmap.md#timeline-to-soft-launch) (BAG-1, BAG-2, BAG-3), later

## Requirements

| ID | P | Requirement |
|---|---|---|
| BAG-1 | P0 | The bag holds the user's cameras, lenses and film stocks, added from the catalogue or as custom entries. When logging a roll, the bag is shown first and the full catalogue is a search away. |
| BAG-2 | P0 | Film pocket: count how many rolls of each stock are left ("3 cuộn Gold 200"), with expiry year for expired film. Loading a roll takes one out. |
| BAG-3 | P0 | Camera card: rolls shot and mistakes on this camera ("12 cuộn · 2 lần lọt sáng"). |
| BAG-4 | P2 | Share the bag as a "what's in my bag" card. |

## Flows

The bag is the first step of [Log a roll](rolls.md#flows): pick the film from the bag, pick the camera from the bag. Custom stocks and cameras ([CAT-2](catalogue.md)) go straight into the bag.

## Data

| Source | Shape |
|---|---|
| PRD | `BagItem`: id, user_id, kind (camera \| lens \| stock), ref_id, nickname, qty, expiry_year, notes |
| [ADR-001](../../architecture/adr-001-tech-stack.md#data-model-mvp) | `bag_item`: user_id, stock_id?, camera_id? |

## Design

No bag artboard yet ([wireframes](../../design/wireframes.md#mvp-screens-with-no-artboard-yet)). Canister colours follow the `stock-*` families in the [design system](../../design/design-system.md#colour).

## Open issues

- ~~BAG-1 includes **lenses**, but the ADR `bag_item` only references stocks and cameras, and there is no lens table in either model. Decide whether lenses are in the MVP.~~ **Resolved 27.09.2026 (Trúc), Known conflict #6, Phase 1 plan D3:** a `lens` table, custom entries only (no seeded lens catalogue in the MVP). `bag_item.kind` = `camera` \| `lens` \| `stock`, `ref_id` points into whichever table `kind` names (no foreign key, house rules).
- BAG-2 and BAG-3 were raised to P0 and moved into Phase 1 on 27.09.2026 (Trúc), so `bag_item` gains `qty` and `expiry_year` in a Phase 1 migration. `nickname` is still not stored.
- BAG-3's mistake count ("2 lần lọt sáng") needs mistake tags (NOTE-2, Phase 2). Until then the camera card shows rolls shot only.
