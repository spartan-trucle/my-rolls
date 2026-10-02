# Missing screens

> MVP screens with no board on the [design canvas](https://claude.ai/artifact/AXpgMvXFo6HL1vrw9RS6gt) yet. Checked 27.09.2026 against canvas version `1790375803-e51e` (50 boards); Phase 1 and Phase 2 drawn the same day; canvas `1790516511-f125` (118 boards). Re-checked 30.09.2026 against `1790765247-6906`. Re-checked 02.10.2026 against `1790936301-40d9`: the Phase 4 rows are drawn on page "Chia sẻ · MVP".
> Every screen needs a phone (390 px) and a desktop (1440 px) design before it is built ([CLAUDE.md](../../CLAUDE.md#conventions)). Tick a row when its boards are on the canvas, and add them to [wireframes.md](wireframes.md).

Back to: [Wireframes](wireframes.md) · [Docs index](../README.md) · [Roadmap](../roadmap.md)

## What the canvas has

Landing page, sign-in and sign-up, onboarding (bag, first roll), home, profile, the Phase 1 screens (new and past roll, catalogue search and no match, custom entry, bag, roll page after saving), the Phase 2 screens on page "Scan & ghi chú" (upload, background tray, upload errors, scan set, roll with scans, one frame, mistakes, notes and memory), lab picker, add lab, share sheet and dialog, friend view (film strip and grid), four story cards, library grid, and roll grid. See [wireframes.md](wireframes.md) for every board.

## Phase 1 · Log a roll

| Done | Screen | Requirement | What exists today |
|---|---|---|---|
| [x] | New roll form: film and camera from the bag first, optional details folded | [ROLL-1](../product/requirements/rolls.md) | `NewRoll` · `NewRollDark` · `NewRollWeb` · `NewRollWebDark` |
| [x] | Past roll form | [ROLL-2](../product/requirements/rolls.md) | `PastRoll` · `PastRollDark` · `PastRollWeb` · `PastRollWebDark` |
| [x] | Catalogue search results, with the no-match state | [CAT-1](../product/requirements/catalogue.md) | `CatalogueSearch…` and `CatalogueEmpty…` (4 boards each) |
| [x] | Custom stock, camera or lens form | [CAT-2](../product/requirements/catalogue.md) | One form per kind, no tabs: `CustomEntry…` (film), `CustomCamera…`, `CustomLens…` (4 boards each). `OnboardBag`'s "+ Film khác" and "+ Máy khác", `CatalogueEmpty`'s add link and `Bag`'s "Thêm ống kính" each open the matching one |
| [x] | Bag screen with lenses | [BAG-1](../product/requirements/bag.md) | `Bag…` (4 boards). The "Túi" tab and `Profile`'s "Sửa túi" link to it |
| [x] | Roll page after saving | [ROLL-1](../product/requirements/rolls.md) | `RollSaved…` (4 boards), built on `RollPage` |

All six were drawn on 27.09.2026 in the D0 design pass ([the Phase 1 plan](../../.planning/plans/phase-1-log-a-roll.md)), phone and desktop in Paper and Darkroom. Approved by Trúc and built in PR #20.

## Phase 2 · Scans & notes

| Done | Screen | Requirement | Boards |
|---|---|---|---|
| [x] | Upload a scan set: drop zone, bulk progress, retry per file | [SCAN-1, SCAN-2](../product/requirements/scans.md) | `UploadScans…`. The drop zone itself is `RollSaved`'s `UploadDrop` |
| [x] | Scan-set details: lab, branch, received date, optional scanner and process. The lab picker exists; this form doesn't | [LAB-3](../product/requirements/labs.md) | `ScanSetForm…` |
| [x] | Mark one frame as tấm ưng or blank | [SCAN-4](../product/requirements/scans.md) | `FrameView…` |
| [x] | Notes and roll memory | [NOTE-1](../product/requirements/notes.md) | `NotesMemory…` |
| [x] | Mistake tagging | [NOTE-2](../product/requirements/notes.md) | `MistakePicker…` |
| [x] | Upload in the background: a tray that follows the user around the app, with done and failed states. *Found while planning Phase 2* | SCAN non-functional ("keeps going while the user moves around the app") | `UploadTray…` |
| [x] | Roll page with scans: scan-set line, numbered frame grid with stamps, memory, notes, "+ Thêm scan". Not COL-1's film strip. *Found while planning Phase 2* | [SCAN-4](../product/requirements/scans.md), [NOTE-1](../product/requirements/notes.md) | `RollFrames…` |
| [x] | Upload states: files over 10 MB, connection lost mid-batch, finished with failures. The roll with no scans is `RollSaved`. *Found while planning Phase 2* | [SCAN-1, SCAN-2](../product/requirements/scans.md) | `UploadErrors…` |
| [x] | Home while uploading: the tray, and the roll card's stamp going from uploading to frame count. *Found while planning Phase 2* | [SCAN-2](../product/requirements/scans.md) | `HomeUploading…` |

All nine were drawn on 27.09.2026 (Phase 2 plan task D0), phone and desktop in Paper and Darkroom, with the plan's blocker defaults: JPEG, PNG and WebP up to 10 MB (no TIFF); a frame can be tấm ưng and oops at once, with several mistake types each; upload drag-over in `cobalt-soft`. The boards also settle the plan's two open questions: files are listed by file name and one frame moves with "Đổi vị trí" in `FrameView`, and the upload starts on drop while the scan-set form fills in beside it. Trúc approved the defaults and the boards on 30.09.2026, so track F can start.

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
| [x] | Link preview image, 1200 × 630. Drawn by 02.10.2026: `LinkPreview`, `LinkPreviewNoScans`, `LinkPreviewChat` | [SHARE-3](../product/requirements/sharing.md) |
| [x] | What a friend sees when a share link is revoked. Drawn by 02.10.2026: `SharedRevoked…` (4 boards) | [SHARE-1](../product/requirements/sharing.md) |

## Across phases

| Done | Gap | Where |
|---|---|---|
| [ ] | Darkroom (dark theme) versions | Labs and collection boards exist only in Paper (sharing got Darkroom boards on page "Chia sẻ · MVP" by 02.10.2026; the story cards and `ShareSheet` / `ShareDialogWeb` stay Paper). Sign-in, onboarding, home, profile and all Phase 1 boards have Darkroom boards |
| [ ] | Empty states: empty bag, empty search, empty "Tấm ưng" tab | Every area. Empty catalogue search is done (`CatalogueEmpty…`) |
| [ ] | The bottom "Tấm ưng" tab | `LibraryGrid` shows every frame, not only keepers |
