# Canister shelf (CAN) — core

> The library as a shelf of canisters the owner colours and labels.

Back to: [Requirements index](README.md) · [PRD overview](../prd.md) · Ships in: [Phase 3](../../roadmap.md#timeline-to-soft-launch)

This is what sets Cuộn apart from Filmer and Frames. Instead of paying for the app, people make each roll theirs. Every roll is a canister on a shelf, coloured and labelled by its owner or shown with a real canister photo from the catalogue.

## Requirements

| ID | P | Requirement |
|---|---|---|
| CAN-1 | P0 | The library shows every roll as a canister on a shelf, newest first. The grid of every frame (COL-3) is one tap away. |
| CAN-2 | P0 | Each roll's canister is either the stock's catalogue photo or a drawn canister the owner customises: any body colour (presets or a picker), the roll name on the label band and a film-type sticker from the stock. The label band stays light so the name reads on any colour. |

### Canister colour presets (PRD)

| Name | Hex |
|---|---|
| Gold | `#e2ae1c` |
| Green | `#2e7a50` |
| Blue | `#3b5f8c` |
| Rose | `#a63e62` |
| Red | `#c23b22` |
| Orange | `#e07a2e` |
| Charcoal | `#4a4541` |
| Cream | `#e6dcc8` |

Gold, Green, Blue, Rose and Charcoal match the design system's `stock-gold`, `stock-green`, `stock-blue`, `stock-rose` and `stock-mono` (Paper theme). Red, Orange and Cream are canister-only presets with no token yet.

Film-type sticker examples: `C-41 · 200`, `E-6 · 100`, `B&W · 400`, `ECN-2 · 500`.

## Flow

**Make the roll yours:** open the roll's canister → use the catalogue photo for the stock, or pick a colour close to the real canister → write the roll name on the label → it joins the shelf.

## Data

`roll.canister_color` (both models). The PRD also has `canister_label` and `canister_photo_id`; the ADR relies on `stock.canister_photo_key` and `roll.name`.

## Design

- [Design system](../../design/design-system.md#colour): `stock-*` colours only on canisters. Never draw a manufacturer's logo, box art or trade dress. The stock name goes as text beside the canister.
- `RollCard` shows a generic canister for list views; the shelf itself has no artboard yet ([wireframes](../../design/wireframes.md#mvp-screens-with-no-artboard-yet)).
- The canister SVG in the PRD artifact (metal caps, light label band, film leader with sprocket holes) is the reference drawing.

## Content work

Recaptured canister and camera photos matched to catalogue entries, due 23.11.2026 ([roadmap](../../roadmap.md#content-track-runs-alongside)).

## Cut line

The free colour picker is cut #4 if Phase 3 runs late: keep the 8 presets and save about 2 h ([roadmap](../../roadmap.md#cut-line)).

## Open issues

- Add tokens for the Red, Orange and Cream presets to the design system, or map the presets onto the existing `stock-*` families only.
- PRD Q5: brand logos in canister photos (keep as reference photos; drawn canisters stay unbranded).
