# Wireframes

> **Reference only.** The [design canvas](https://claude.ai/artifact/AXpgMvXFo6HL1vrw9RS6gt) ("Roll Call Landing Page") holds wireframes and ideas. Code may change layouts and details. When a wireframe disagrees with the [PRD](../product/prd.md) or the [design system](design-system.md), those two win.
>
> Indexed 25.09.2026 from canvas version `1790318000-c9a4` (re-indexed after the "Đăng nhập" and "Kệ & hồ sơ" pages were added). The canvas installs the [design system](design-system.md) as `rollcall`.

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

## Page "Đăng nhập" (sign-in and sign-up)

Google is the only way in. Each screen has four boards: phone and desktop, Paper and Darkroom (`…Dark`, `…Web`, `…WebDark`).

| Artboards | Size | What it shows | PRD |
|---|---|---|---|
| `Login` · `LoginDark` · `LoginWeb` · `LoginWebDark` | 390 × 844 · 1440 × 900 | Sign in: "Chào mừng trở lại", one "Đăng nhập bằng Google" button, what Cuộn takes from Google, link to sign-up. Phone shows a film strip; desktop a photo panel of prints | [AUTH-1](../product/requirements/auth.md) |
| `Signup` · `SignupDark` · `SignupWeb` · `SignupWebDark` | 390 × 844 · 1440 × 900 | Sign-up step 1 of 2: three perks, "Đăng ký bằng Google", Terms and Privacy links, link to sign-in | [AUTH-1](../product/requirements/auth.md) |
| `SignupProfile` · `SignupProfileDark` · `SignupProfileWeb` · `SignupProfileWebDark` | 390 × 844 · 1440 × 900 | Sign-up step 2 of 2: avatar, editable display name, read-only email "từ Google", "Tiếp tục" to onboarding, "Dùng tài khoản Google khác" | [AUTH-1](../product/requirements/auth.md) |

## Page "Kệ & hồ sơ" (shelf and profile)

Same four boards per screen.

| Artboards | Size | What it shows | PRD |
|---|---|---|---|
| `OnboardBag` · `OnboardBagDark` · `OnboardBagWeb` · `OnboardBagWebDark` | 390 × 1080 · 1440 × 900 | Onboarding step 1 of 2, "Trong túi bạn có gì?": catalogue search, camera and film chips, "+ Máy khác" / "+ Film khác", skip | [CAT-1, CAT-2](../product/requirements/catalogue.md); [BAG-1](../product/requirements/bag.md) partly (no lenses) |
| `OnboardFirst` · `OnboardFirstDark` · `OnboardFirstWeb` · `OnboardFirstWebDark` | 390 × 844 · 1440 × 900 | Onboarding step 2 of 2, "Lên kệ cuộn đầu tiên": choose a past roll or a roll still in the camera; the forms themselves aren't drawn | [ROLL-1, ROLL-2](../product/requirements/rolls.md) entry points only |
| `Home` · `HomeDark` · `HomeWeb` · `HomeWebDark` | 390 × 1240 · 1440 × 1000 | Home after sign-in, "Kệ của …": counts line, lab pickup banner, rolls as a list of `RollCard`s with a "Lưới" grid toggle, bottom tabs (Kệ, Túi, Cuộn mới, Tấm ưng, Tôi) | [CAN-1](../product/requirements/canister.md) partly: a RollCard list, not canisters on a shelf; [COL-1, COL-3](../product/requirements/collection.md) entry points |
| `Profile` · `ProfileDark` · `ProfileWeb` · `ProfileWebDark` | 390 × 1620 · 1440 × 1060 | Profile, "Hồ sơ": Google avatar and email, change display name, stat tiles, "Túi của tôi", recent keepers, settings (theme, language, active share links), sign out, delete account | [AUTH-1](../product/requirements/auth.md); [AUTH-2](../product/requirements/auth.md) is v1.1a; stats are not in the PRD |

## MVP screens with no artboard yet

Every new screen needs a design before it is built. These P0 areas have no dedicated artboard on the canvas yet:

- New roll and past roll forms with the bag-first picker ([ROLL-1, ROLL-2](../product/requirements/rolls.md), [BAG-1](../product/requirements/bag.md)). Onboarding only offers the choice
- The bag outside onboarding, with lenses ([BAG-1](../product/requirements/bag.md)). Onboarding covers cameras, film and custom entries ([CAT-2](../product/requirements/catalogue.md))
- Upload and scan-set flow ([SCAN-1–3](../product/requirements/scans.md))
- Notes, memory and mistake tagging ([NOTE-1, NOTE-2](../product/requirements/notes.md))
- Canister shelf and canister editor ([CAN-1, CAN-2](../product/requirements/canister.md)). The `Home` board shows a RollCard list; CAN-1 asks for canisters on a shelf, and the PRD wins. The mobile roll page reference is `RollPage` in the [design system](design-system.md#mobile).
- Roll page in film-strip view for the owner ([COL-1](../product/requirements/collection.md))

## Reading an artboard

Each artboard is a `.dc.html` file under `project/` in the artifact. To pull one into the repo for reference: `Artifact read` with the canvas URL and `path: "project/<name>.dc.html"`. Artboards are interactive prototypes, not production code.
