# Wireframes

> **Reference only.** The [design canvas](https://claude.ai/artifact/AXpgMvXFo6HL1vrw9RS6gt) ("Roll Call Landing Page") holds wireframes and ideas. Code may change layouts and details. When a wireframe disagrees with the [PRD](../product/prd.md) or the [design system](design-system.md), those two win.
>
> Indexed 25.09.2026 from canvas version `1790307652-d78a`. The canvas installs the [design system](design-system.md) as `rollcall`.

Every product screen has a phone (390 px) and a desktop (1440 px) version, as the PRD requires. Story cards are fixed 1080 × 1920 images, drawn at half size (540 × 960).

## Page "Landing page"

| Artboard | Size | What it shows |
|---|---|---|
| `Main.dc.html` | 1440 × 5580 | Landing page, desktop, English |
| `Main-vi.dc.html` | 1440 × 5580 | Landing page, desktop, Vietnamese |
| `Mobile.dc.html` | 390 × 6100 | Landing page, phone, English |
| `Mobile-vi.dc.html` | 390 × 6100 | Landing page, phone, Vietnamese |

## Page "Chia sẻ & lab" (sharing and labs)

| Artboard | Size | What it shows | PRD |
|---|---|---|---|
| `StoryStrip.dc.html` | 540 × 960 | Story card: Dải phim (film strip) | [SHARE-4](../product/requirements/sharing.md), MVP |
| `StoryTicket.dc.html` | 540 × 960 | Story card: Phiếu cuộn (roll ticket) | [SHARE-4](../product/requirements/sharing.md), MVP |
| `StoryCollage.dc.html` | 540 × 960 | Story card: Ảnh dán (collage) | [SHARE-5](../product/requirements/sharing.md), v1.1 |
| `StoryOops.dc.html` | 540 × 960 | Story card: Oops của cuộn | [SHARE-5](../product/requirements/sharing.md), v1.1 |
| `ShareSheet.dc.html` | 390 × 844 | Share a roll, phone (bottom sheet) | [SHARE-1, SHARE-4](../product/requirements/sharing.md) |
| `ShareDialogWeb.dc.html` | 1440 × 900 | Share a roll, desktop (dialog) | [SHARE-1, SHARE-4](../product/requirements/sharing.md) |
| `SharedRoll.dc.html` | 390 × 1680 | Friend opens the link, phone, film strip | [SHARE-2](../product/requirements/sharing.md) |
| `SharedRollWeb.dc.html` | 1440 × 2260 | Friend opens the link, desktop, film strip | [SHARE-2](../product/requirements/sharing.md) |
| `SharedGrid.dc.html` | 390 × 1660 | Friend opens the link, phone, grid | [COL-5](../product/requirements/collection.md) |
| `SharedGridWeb.dc.html` | 1440 × 1600 | Friend opens the link, desktop, grid | [COL-5](../product/requirements/collection.md) |
| `LabPicker.dc.html` | 390 × 844 | Pick a lab, phone | [LAB-1, LAB-3](../product/requirements/labs.md) |
| `LabPickerWeb.dc.html` | 1440 × 900 | Pick a lab, desktop | [LAB-1, LAB-3](../product/requirements/labs.md) |
| `LabAdd.dc.html` | 390 × 844 | Add a new lab, phone | [LAB-2](../product/requirements/labs.md) |
| `LabAddWeb.dc.html` | 1440 × 900 | Add a new lab, desktop | [LAB-2](../product/requirements/labs.md) |

## Page "Bộ sưu tập" (collection)

| Artboard | Size | What it shows | PRD |
|---|---|---|---|
| `LibraryGrid.dc.html` | 390 × 1380 | Library (Kệ) in grid view, phone: every frame of every roll | [COL-3](../product/requirements/collection.md) |
| `LibraryGridWeb.dc.html` | 1440 × 1540 | Library in grid view, desktop | [COL-3](../product/requirements/collection.md) |
| `RollGrid.dc.html` | 390 × 1500 | One roll in grid view, phone: select many, mark once | [COL-1, COL-2, COL-4](../product/requirements/collection.md) |
| `RollGridWeb.dc.html` | 1440 × 1300 | One roll in grid view, desktop | [COL-1, COL-2, COL-4](../product/requirements/collection.md) |

## MVP screens with no artboard yet

Every new screen needs a design before it is built. These P0 areas have no dedicated artboard on the canvas yet:

- Sign-in ([AUTH-1](../product/requirements/auth.md))
- New roll and past roll with the bag-first picker ([ROLL-1, ROLL-2](../product/requirements/rolls.md), [BAG-1](../product/requirements/bag.md))
- Bag and custom stock/camera ([BAG-1](../product/requirements/bag.md), [CAT-2](../product/requirements/catalogue.md))
- Upload and scan-set flow ([SCAN-1–3](../product/requirements/scans.md))
- Notes, memory and mistake tagging ([NOTE-1, NOTE-2](../product/requirements/notes.md))
- Canister shelf and canister editor ([CAN-1, CAN-2](../product/requirements/canister.md)). The mobile roll page reference is `RollPage` in the [design system](design-system.md#mobile).
- Roll page in film-strip view for the owner ([COL-1](../product/requirements/collection.md))

## Reading an artboard

Each artboard is a `.dc.html` file under `project/` in the artifact. To pull one into the repo for reference: `Artifact read` with the canvas URL and `path: "project/<name>.dc.html"`. Artboards are interactive prototypes, not production code.
