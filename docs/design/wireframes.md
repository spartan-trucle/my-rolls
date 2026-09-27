# Wireframes

> **Reference only.** The [design canvas](https://claude.ai/artifact/AXpgMvXFo6HL1vrw9RS6gt) ("Roll Call Landing Page") holds wireframes and ideas. Code may change layouts and details. When a wireframe disagrees with the [PRD](../product/prd.md) or the [design system](design-system.md), those two win.
>
> Indexed 25.09.2026 from canvas version `1790318000-c9a4` (re-indexed after the "Đăng nhập" and "Kệ & hồ sơ" pages were added). Re-checked 25.09.2026 against version `1790325947-074d`: same pages, boards and sizes. Updated 27.09.2026 to version `1790513747-0dce` (82 boards): the Phase 1 screens were added to "Kệ & hồ sơ", and the `Home`, `Profile` and `OnboardBag` boards now link to them. The canvas installs the [design system](design-system.md) as `rollcall`.

Every product screen has a phone (390 px) and a desktop (1440 px) version, as the PRD requires. Story cards are fixed 1080 × 1920 images, drawn at half size (540 × 960).

## Page "Landing page"

| Artboard | Size | What it shows |
|---|---|---|
| `Main.dc.html` | 1440 × 5580 | Landing page, desktop, English |
| `Main-vi.dc.html` | 1440 × 5580 | Landing page, desktop, Vietnamese |
| `Mobile.dc.html` | 390 × 6100 | Landing page, phone, English |
| `Mobile-vi.dc.html` | 390 × 6100 | Landing page, phone, Vietnamese |

### Built: the landing page at `/`

Signed-out visitors get the landing page at `/`; signed-in users get home. It's built from `Main-vi` and `Mobile-vi` in `src/components/landing/`, with its copy under `landing` in `messages/vi.json`. The English boards aren't used, because the UI is Vietnamese only. The canvas's photos, camera and stickers are in `public/landing/`.

Layout: the phone board up to 1199 px (widened on tablets), the desktop board from 1200 px. Between 1200 and 1439 px the hero picture shrinks to 80% so the headline keeps its 600 px column.

Where the code differs from the boards:

| On the boards | In the code | Why |
|---|---|---|
| "Roll Call" | "Cuộn" (`common.appName`) | Product name in docs and code ([Known conflicts](../README.md#known-conflicts-between-sources) #1) |
| Email field under "Tham gia cùng Roll Call", then "Bạn đã có tên trong danh sách" | An "Đăng ký" button to `/sign-up`, with the `Signup` board's wording: "Miễn phí. Chỉ cần một tài khoản Google." and "Đã có tài khoản? Đăng nhập" | Sign-up is Google only ([AUTH-1](../product/requirements/auth.md)), and nothing stores a waitlist |
| Stamps and labels "Lỡ tay", "18 tấm ưng ý", "13 lần lỡ tay" | "Oops", "18 tấm ưng", "13 oops" | The [PRD glossary](../product/prd.md#words-we-use). The headline "mọi cú lỡ tay." stays: it's prose, not a status |
| A photo of a branded yellow canister | A drawn canister in `stock-gold` with "COLOR · 200 · 36 KIỂU" on its label | The [design system](design-system.md) never shows a manufacturer's logo, box art or trade dress |
| Footer links "Giới thiệu", "Quyền riêng tư", "Liên hệ" | "Giới thiệu", "Điều khoản" (`/terms`), "Quyền riêng tư" (`/privacy`) | There's no contact page or address yet |
| Roll cards on the shelf link to the top of the page | Roll cards are not links | There's no sample roll to open |
| "Xem thử một cuộn mẫu" | Scrolls to the rolling film strip (`#roll`) | There's no sample roll page |
| Phone menu button with no menu drawn | Opens a panel with Tính năng, Kệ phim, Chia sẻ and Đăng nhập | The board doesn't show the open state |
| Phone hero print has a date | No date on the phone print | At 140 px the date squeezes the caption to one word per line |
| English accessible names ("Main", "A roll, frame by frame") | Vietnamese ("Điều hướng chính", "Một cuộn, từng khung một") | The UI language is Vietnamese |

The rolling strip pauses on hover and keyboard focus, and everything stops for people who prefer reduced motion.

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
| `NewRoll` · `NewRollDark` · `NewRollWeb` · `NewRollWebDark` | 390 × 844 · 1440 × 1160 | New roll, "Cuộn mới": film and camera picked as chips from the bag (both required), box ISO filled from the film, catalogue one tap away ("+ Film khác", "+ Máy khác"). "Thêm chi tiết" folds the optional fields: name, lens, format, exposures, box and shot-at ISO with live push/pull (`+1`, `−⅓`, a warning at ±3), load and finish dates, locations. Phone: fields scroll, Save stays pinned. Desktop: details open, live `RollCard` preview beside the form. "Đang trong máy / Đã chụp xong" switches to `PastRoll` | [ROLL-1](../product/requirements/rolls.md), [BAG-1](../product/requirements/bag.md) |
| `NewRollQuick` · `NewRollQuickDark` · `NewRollQuickWeb` · `NewRollQuickWebDark` | 390 × 844 · 1440 × 1160 | The new-roll form with a film that isn't in the bag: "+ Film khác" opens a search inside the form (no sheet), top 5 catalogue results with "Trong túi" or "+ Chọn", a link to the full catalogue when there are more, and "+ Thêm film riêng" when nothing matches. The picked film joins the chips with a "mới" tag, and "Thêm … vào túi cho lần sau" (on by default) decides whether it stays in the bag. Also in `NewRoll` and `PastRoll` | [ROLL-1](../product/requirements/rolls.md), [CAT-1](../product/requirements/catalogue.md), [BAG-1](../product/requirements/bag.md) |
| `PastRoll` · `PastRollDark` · `PastRollWeb` · `PastRollWebDark` | 390 × 844 · 1440 × 1160 | Past roll, "Cuộn đã chụp": the same form with step 1 of 2, "Chụp khoảng khi nào" (month and year, no future dates) instead of load dates, and "Lưu, rồi tải scan lên" | [ROLL-2](../product/requirements/rolls.md) |
| `CatalogueSearch` · `CatalogueSearchDark` · `CatalogueSearchWeb` · `CatalogueSearchWebDark` | 390 × 844 · 1440 × 900 | Catalogue search: bottom sheet on phone, dialog on desktop, over the roll form. Film / Máy ảnh tabs, accent-free search (live filter), results with canister colour, brand, type, ISO and format; "Trong túi" on items already in the bag, "+ Chọn" picks and adds to the bag | [CAT-1](../product/requirements/catalogue.md) |
| `CatalogueEmpty` · `CatalogueEmptyDark` · `CatalogueEmptyWeb` · `CatalogueEmptyWebDark` | 390 × 844 · 1440 × 900 | The same sheet and dialog with no match ("aerocolor"): empty canister, "Danh mục chưa có …", "+ Thêm film riêng" to the custom form, and a way to clear the search | [CAT-1, CAT-2](../product/requirements/catalogue.md) |
| `CustomEntry` · `CustomEntryDark` · `CustomEntryWeb` · `CustomEntryWebDark` | 390 × 1040 · 1440 × 900 | Custom entry, one form with Film / Máy ảnh / Ống kính tabs. Film: brand or who rolled it, name, box ISO, film type (sets the canister colour, previewed live), formats. Camera: brand, model, format, nickname. Lens: brand, name, focal length. "Chỉ mình bạn thấy" note; no submit-to-catalogue toggle (CAT-3 is v1.1b) | [CAT-2](../product/requirements/catalogue.md), [BAG-1](../product/requirements/bag.md) lenses |
| `Bag` · `BagDark` · `BagWeb` · `BagWebDark` | 390 × 1400 · 1440 × 1120 | The bag, "Túi": a film pocket (unshot rolls as canisters on a ledge), catalogue search entry, then film first (with a − / + count of unshot rolls per stock; at 0 the row reads "HẾT" and − becomes remove), cameras and lenses as rows with meta and roll counts, a "Riêng" stamp on custom entries, remove with undo, and add links (lenses go to the custom form). Bottom tab "Túi" active | [BAG-1](../product/requirements/bag.md) |
| `RollSaved` · `RollSavedDark` · `RollSavedWeb` · `RollSavedWebDark` | 390 × 1360 · 1440 × 1000 | Roll page after saving: "Đã lên kệ" banner, "Cuộn #16" with a name link, film data in mono, stamps (Chờ scan, Đẩy +1), the canister landing on the shelf, an `UploadDrop` for scans and a details list with "Sửa" | [ROLL-1, ROLL-2](../product/requirements/rolls.md); the drop zone is a placeholder until [SCAN-1](../product/requirements/scans.md) (Phase 2) |

Roll counts per stock (film chips show `×3`, the form says how many are left after saving, custom film asks "Đang có") are BAG-2, a P1 requirement, drawn at Trúc's request on 27.09.2026; the MVP data model has no `qty` column yet (see [Known conflicts](../README.md#known-conflicts-between-sources) #6 and plan D1–D5). Custom and shop-rolled film is called "chiết" in the UI. Phase 1 decisions drawn into these boards: lenses are custom-only (plan D3), push/pull is computed and rounded to ⅓ stop (D17), and custom entries stay private (CAT-3's shared-directory toggle is left out). The boards use sample data from the `Profile` bag (Pentax K1000, Nikon FM2, Olympus mju II; Gold 200, Superia 400, HP5 Plus 400, Vision3 500T) plus one custom film and two lenses.

## MVP screens with no artboard yet

The full list by phase, checked against canvas `0dce`, is a checklist in [missing-screens.md](missing-screens.md).

Every new screen needs a design before it is built. These P0 areas have no dedicated artboard on the canvas yet:

- Upload and scan-set flow ([SCAN-1–3](../product/requirements/scans.md))
- Notes, memory and mistake tagging ([NOTE-1, NOTE-2](../product/requirements/notes.md))
- Canister shelf and canister editor ([CAN-1, CAN-2](../product/requirements/canister.md)). The `Home` board shows a RollCard list; CAN-1 asks for canisters on a shelf, and the PRD wins. The mobile roll page reference is `RollPage` in the [design system](design-system.md#mobile).
- Roll page in film-strip view for the owner ([COL-1](../product/requirements/collection.md))

## Reading an artboard

Each artboard is a `.dc.html` file under `project/` in the artifact. To pull one into the repo for reference: `Artifact read` with the canvas URL and `path: "project/<name>.dc.html"`. Artboards are interactive prototypes, not production code.
