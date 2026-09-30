# Missing screens

> MVP screens with no board on the [design canvas](https://claude.ai/artifact/AXpgMvXFo6HL1vrw9RS6gt) yet. Checked 27.09.2026 against canvas version `1790375803-e51e` (50 boards); Phase 1 drawn the same day, canvas `1790513747-0dce` (82 boards).
> Every screen needs a phone (390 px) and a desktop (1440 px) design before it is built ([CLAUDE.md](../../CLAUDE.md#conventions)). Tick a row when its boards are on the canvas, and add them to [wireframes.md](wireframes.md).

Back to: [Wireframes](wireframes.md) · [Docs index](../README.md) · [Roadmap](../roadmap.md)

## What the canvas has

Landing page, sign-in and sign-up, onboarding (bag, first roll), home, profile, the Phase 1 screens (new and past roll, catalogue search and no match, custom entry, bag, roll page after saving), lab picker, add lab, share sheet and dialog, friend view (film strip and grid), four story cards, library grid, and roll grid. See [wireframes.md](wireframes.md) for every board.

## Phase 1 · Log a roll

| Done | Screen | Requirement | What exists today |
|---|---|---|---|
| [x] | New roll form: film and camera from the bag first, optional details folded | [ROLL-1](../product/requirements/rolls.md) | `NewRoll` · `NewRollDark` · `NewRollWeb` · `NewRollWebDark` |
| [x] | Past roll form | [ROLL-2](../product/requirements/rolls.md) | `PastRoll` · `PastRollDark` · `PastRollWeb` · `PastRollWebDark` |
| [x] | Catalogue search results, with the no-match state | [CAT-1](../product/requirements/catalogue.md) | `CatalogueSearch…` and `CatalogueEmpty…` (4 boards each) |
| [x] | Custom stock, camera or lens form | [CAT-2](../product/requirements/catalogue.md) | `CustomEntry…` (4 boards). `OnboardBag`'s "+ Máy khác" and "+ Film khác" now link to it |
| [x] | Bag screen with lenses | [BAG-1](../product/requirements/bag.md) | `Bag…` (4 boards). The "Túi" tab and `Profile`'s "Sửa túi" link to it |
| [x] | Roll page after saving | [ROLL-1](../product/requirements/rolls.md) | `RollSaved…` (4 boards), built on `RollPage` |

All six were drawn on 27.09.2026 in the D0 design pass ([the Phase 1 plan](../../.planning/plans/phase-1-log-a-roll.md)), phone and desktop in Paper and Darkroom. They wait for Trúc's approval before D1–D3 start.

## Phase 2 · Scans & notes

| Done | Screen | Requirement |
|---|---|---|
| [ ] | Upload a scan set: drop zone, bulk progress, retry per file | [SCAN-1, SCAN-2](../product/requirements/scans.md) |
| [ ] | Scan-set details: lab, branch, received date, optional scanner and process. The lab picker exists; this form doesn't | [LAB-3](../product/requirements/labs.md) |
| [ ] | Mark one frame as tấm ưng or blank | [SCAN-4](../product/requirements/scans.md) |
| [ ] | Notes and roll memory | [NOTE-1](../product/requirements/notes.md) |
| [ ] | Mistake tagging | [NOTE-2](../product/requirements/notes.md) |

## Phase 3 · Shelf & collection

| Done | Screen | Requirement | What exists today |
|---|---|---|---|
| [ ] | Canister shelf | [CAN-1](../product/requirements/canister.md) | `Home` shows a `RollCard` list, not canisters |
| [ ] | Canister editor: colour and label | [CAN-2](../product/requirements/canister.md) | Nothing |
| [ ] | Owner's roll page in film-strip view, desktop | [COL-1](../product/requirements/collection.md) | Grid view only (`RollGrid`) |
| [ ] | Filters and lightbox | [COL-2](../product/requirements/collection.md) | Nothing |

## Phase 4 · Sharing

| Done | Screen | Requirement |
|---|---|---|
| [ ] | Link preview image, 1200 × 630. Only the story cards are drawn | [SHARE-3](../product/requirements/sharing.md) |
| [ ] | What a friend sees when a share link is revoked | [SHARE-1](../product/requirements/sharing.md) |

## Across phases

| Done | Gap | Where |
|---|---|---|
| [ ] | Darkroom (dark theme) versions | Sharing, labs and collection boards exist only in Paper. Sign-in, onboarding, home, profile and all Phase 1 boards have Darkroom boards |
| [ ] | Empty states: empty bag, empty search, empty "Tấm ưng" tab | Every area. Empty catalogue search is done (`CatalogueEmpty…`) |
| [ ] | The bottom "Tấm ưng" tab | `LibraryGrid` shows every frame, not only keepers |
