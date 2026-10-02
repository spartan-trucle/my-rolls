# Wireframes

> **Reference only.** The [design canvas](https://claude.ai/artifact/AXpgMvXFo6HL1vrw9RS6gt) ("Roll Call Landing Page") holds wireframes and ideas. Code may change layouts and details. When a wireframe disagrees with the [PRD](../product/prd.md) or the [design system](design-system.md), those two win.
>
> Indexed 25.09.2026 from canvas version `1790318000-c9a4` (re-indexed after the "Đăng nhập" and "Kệ & hồ sơ" pages were added). Re-checked 25.09.2026 against version `1790325947-074d`: same pages, boards and sizes. Updated 27.09.2026 to version `1790516511-f125` (118 boards): the Phase 1 screens were added to "Kệ & hồ sơ" and the Phase 2 screens to a new page "Scan & ghi chú". Re-checked 30.09.2026 against version `1790765247-6906`: same pages and boards, and the `Home`, `Profile` and `OnboardBag` boards now link to them. Re-checked 02.10.2026 against version `1790936301-40d9` (147 boards): a new page "Chia sẻ · MVP" with 21 Phase 4 boards ([below](#page-chia-sẻ--mvp-sharing-phase-4)); the other pages are unchanged. Updated 02.10.2026 to version `1790944574-5a0f` (175 boards): the Phase 3 boards on a new page "Kệ & bộ sưu tập", which also took the four "Bộ sưu tập" boards ([below](#page-kệ--bộ-sưu-tập-shelf-and-collection-phase-3)); the "Bộ sưu tập" page is now empty. The canvas installs the [design system](design-system.md) as `rollcall`.

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

## Page "Chia sẻ · MVP" (sharing, Phase 4)

Added by 02.10.2026. Screens have up to four boards (phone and desktop, Paper and Darkroom: `…Dark`, `…Web`, `…WebDark`); the link previews are fixed-size images. The boards use `[domain]` until roadmap decision 1 picks the name.

| Artboards | Size | What it shows | PRD |
|---|---|---|---|
| `ShareRoll` · `ShareRollDark` · `ShareRollWeb` · `ShareRollWebDark` | 390 × 844 · 1440 × 900 | "Chia sẻ cuộn này": the 1080 × 1920 story preview with room for the link sticker, story templates Dải phim and Phiếu cuộn, the roll link with "Đổi link" and "Tắt link", "Ai có link đều xem được, không cần tài khoản" and "Không ai tải được ảnh gốc". Desktop: "Tải ảnh và chép link", and a hint to post the story from a phone | [SHARE-1, SHARE-4](../product/requirements/sharing.md) |
| `ShareLink` · `ShareLinkDark` · `ShareLinkWeb` · `ShareLinkWebDark` | 390 × 844 · 1440 × 900 | Change or turn off the link: the active link and its date, "Đổi link mới" (the old link stops at once) or "Tắt chia sẻ" (no one can open the roll until a new link is made; posted stories open "Link này không mở được nữa"), then the confirmations and the "Chưa có link" state with "Tạo link mới" | [SHARE-1](../product/requirements/sharing.md) |
| `ShareInApp` · `ShareInAppDark` | 390 × 844 | The share screen opened inside Zalo's in-app browser: "Ở đây chưa đăng story được", three steps (save the story image, copy the link, post from Instagram with a link sticker), or open in Safari or Chrome | [SHARE-4](../product/requirements/sharing.md), roadmap risk "Web Share inside in-app browsers" |
| `LinkPreview` | 1200 × 630 | The link preview image for a roll with scans: owner and roll number, title, film and camera in mono, keeper and oops counts, "bấm để xem cả cuộn", with the 1:1 crop marked | [SHARE-3](../product/requirements/sharing.md) |
| `LinkPreviewNoScans` | 1200 × 630 | The same for a roll still at the lab: a drawn canister, "cuộn đang ở lab, sắp có scan", "Chờ scan" | [SHARE-3](../product/requirements/sharing.md) |
| `LinkPreviewChat` | 390 × 844 | A sample chat (not Cuộn's UI) showing the preview as a wide card and as a square crop | [SHARE-3](../product/requirements/sharing.md) |
| `SharedRevoked` · `SharedRevokedDark` · `SharedRevokedWeb` · `SharedRevokedWebDark` | 390 × 844 · 1440 × 900 | What a friend sees on a revoked link: "Link này không mở được nữa", ask the owner for a new one, then a sign-up pitch "Tạo kệ của bạn — miễn phí" | [SHARE-1](../product/requirements/sharing.md) |
| `SharedRollDark` · `SharedRollWebDark` | 390 × 1680 · 1440 × 2260 | Darkroom versions of the friend view, film strip (Paper boards on page "Chia sẻ & lab") | [SHARE-2](../product/requirements/sharing.md) |
| `SharedGridDark` · `SharedGridWebDark` | 390 × 1660 · 1440 × 1600 | Darkroom versions of the friend view, grid | [COL-5](../product/requirements/collection.md) |

## Page "Kệ & bộ sưu tập" (shelf and collection, Phase 3)

Drawn 02.10.2026 for the [Phase 3 plan](../../.planning/plans/phase-3-shelf-and-collection.md) (task D0), with its blocker defaults: canister presets including `stock-red`, `stock-orange` and `stock-cream` with a `line-strong` edge on every drawn body, bulk Oops through the mistake picker, and three canister looks (follow the film, drawn, catalogue photo). Four boards per screen (phone and desktop, Paper and Darkroom: `…Dark`, `…Web`, `…WebDark`) unless noted. The existing `RollGrid` and `LibraryGrid` boards moved here from "Bộ sưu tập". **Awaiting Trúc's approval.**

| Artboards | Size | What it shows | PRD |
|---|---|---|---|
| `Shelf` | 390 × 844 · 1440 × 900 | Home in Kệ view: "Kệ của Trúc", count line "5 CUỘN · 108 TẤM · 16 TẤM ƯNG", Kệ/Lưới switch, "Mới nhất trước", drawn canisters on wooden ledges newest first (3 per ledge on phone, 6 on desktop). Each canister: roll name on the light label band, film-type sticker (`C-41 · 200`), the stock name as text under it, and the upload stamp (`12/36`, `2 lỗi`), "Chờ scan" or a frame count. The Tấm ưng tab links to the library grid | [CAN-1, CAN-2](../product/requirements/canister.md), [COL-3](../product/requirements/collection.md) |
| `ShelfEmpty` | 390 × 844 · 1440 × 900 | No rolls yet: an empty ledge with a dashed placeholder canister, "Kệ còn trống", the primary "Lên kệ cuộn đầu tiên" and a link "Thêm cuộn đã chụp" | [CAN-1](../product/requirements/canister.md) |
| `RollStrip` | 390 × 960 · 1440 × 920 | Owner's roll in Dải phim view: RollGrid's header with the canister ("Đổi vỏ"), stamps, Dải phim/Lưới switch, an edge-to-edge strip of uncropped frames (150 px phone, 200 px desktop) with one keeper or oops flag each (keeper wins), then the scan-set row, Kỷ niệm and Ghi chú | [COL-1](../product/requirements/collection.md), [CAN-2](../product/requirements/canister.md) |
| `CanisterEditor` | 390 × 844 · 1440 × 900 | "Vỏ cuộn": a sheet on phone, a dialog on desktop. Live preview with the stock name under it, Kiểu vỏ "Theo màu film / Tự vẽ / Ảnh vỏ thật" (the photo option only when the stock has a photo), 8 preset swatches with names, "Màu khác" picker, "Tên trên nhãn là tên cuộn. Đổi tên", "Lưu". Phone shows a picked custom colour; desktop shows the photo option | [CAN-2](../product/requirements/canister.md) |
| `Lightbox` | 390 × 844 · 1440 × 900 | One frame large on the film ground: "Tấm 14/36", close, "Chi tiết" to `FrameView`, keeper/oops stamps. Phone: swipe hint. Desktop: ‹ › that stop at both ends and "← → để chuyển tấm · Esc để đóng"; opened from the Oops filter it reads "Tấm 3/36 · Oops 1/3" | [COL-2](../product/requirements/collection.md) |
| `RollGrid` · `RollGridDark` · `RollGridWeb` · `RollGridWebDark` | 390 × 1500 · 1440 × 1300 | One roll in grid view: filter chips with counts, select many (long-press on phone; click, Shift-click, K / O / B on desktop), selection bar Tấm ưng / Oops / Tấm trắng / Bỏ chọn. Darkroom boards are colour copies of the Paper ones (they still say "Kệ của tui") | [COL-1, COL-2, COL-4](../product/requirements/collection.md) |
| `LibraryGrid` · `LibraryGridDark` · `LibraryGridWeb` · `LibraryGridWebDark` | 390 × 1380 · 1440 × 1540 | Every frame of every roll, grouped by roll with a canister header and "Xem cả cuộn ›", filters Tất cả / Tấm ưng / Oops | [COL-3](../product/requirements/collection.md) |
| `LibraryGridKeepersEmpty` · `LibraryGridKeepersEmptyWeb` | 390 × 844 · 1440 × 900 | The library grid with Tấm ưng on and nothing marked: "Chưa có tấm ưng nào" and a hint to mark frames in a roll's Lưới (desktop mentions K). Paper only | [COL-3](../product/requirements/collection.md) |
| `MistakePickerBulk` · `MistakePickerBulkWeb` | 390 × 844 · 1440 × 900 | Bulk Oops: the mistake picker titled "Oops cho 3 tấm" over the roll grid's selection, without "Tấm này / Cả cuộn", thumbnails of the selected frames, the 13 chips with a note each, "mistakes are added, existing ones stay", "Lưu · thêm cho 3 tấm". Paper only | [COL-4](../product/requirements/collection.md), [NOTE-2](../product/requirements/notes.md) |

What the canvas boards do that the code won't copy as-is: the film strip is drawn from the design system's strip markup so frames stay uncropped (the `FilmStrip` component crops with `cover`), the new canister colours are inline in each board's CSS (the canvas's installed copy of the design system predates `cc6e`), and "Đổi tên" points at the roll form because there's no rename screen.

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
| `PastRoll` · `PastRollDark` · `PastRollWeb` · `PastRollWebDark` | 390 × 844 · 1440 × 1160 | Past roll, "Cuộn đã chụp": the same form with step 1 of 2, but film is search-first: a catalogue search box (custom films included) with "Film bạn từng dùng" chips below it and no bag counts, because an old roll's stock is often no longer in the bag (Trúc, 27.09.2026). Picking a catalogue film doesn't add it to the bag. Camera chips are labelled "Máy ảnh", not "trong túi". "Chụp khoảng khi nào" (month and year, no future dates) replaces load dates, and Save is "Lưu, rồi tải scan lên" | [ROLL-2](../product/requirements/rolls.md) |
| `CatalogueSearch` · `CatalogueSearchDark` · `CatalogueSearchWeb` · `CatalogueSearchWebDark` | 390 × 844 · 1440 × 900 | Catalogue search: bottom sheet on phone, dialog on desktop, over the roll form. Film / Máy ảnh tabs, accent-free search (live filter), results with canister colour, brand, type, ISO and format; "Trong túi" on items already in the bag, "+ Chọn" picks and adds to the bag | [CAT-1](../product/requirements/catalogue.md) |
| `CatalogueEmpty` · `CatalogueEmptyDark` · `CatalogueEmptyWeb` · `CatalogueEmptyWebDark` | 390 × 844 · 1440 × 900 | The same sheet and dialog with no match ("aerocolor"): empty canister, "Danh mục chưa có …", "+ Thêm film riêng" to the custom form, and a way to clear the search | [CAT-1, CAT-2](../product/requirements/catalogue.md) |
| `CustomEntry` · `CustomEntryDark` · `CustomEntryWeb` · `CustomEntryWebDark` | 390 × 1040 · 1440 × 900 | Custom film, reached from "+ Film khác" (onboarding) or "+ Thêm film riêng" (catalogue, no match). No kind tabs: each add button opens its own form. Brand or who rolled it, name, box ISO, unshot count, film type (sets the canister colour, previewed live), formats. "Chỉ mình bạn thấy" note; no submit-to-catalogue toggle (CAT-3 is v1.1b) | [CAT-2](../product/requirements/catalogue.md) |
| `CustomCamera` · `CustomCameraDark` · `CustomCameraWeb` · `CustomCameraWebDark` | 390 × 844 · 1440 × 900 | Custom camera, reached from "+ Máy khác" (onboarding) or "+ Thêm máy riêng" (catalogue, no match, camera tab). Brand, model, format (35mm / 120 / Khác), nickname. A live preview of the bag row with the "Riêng" stamp | [CAT-2](../product/requirements/catalogue.md), [BAG-1](../product/requirements/bag.md) |
| `CustomLens` · `CustomLensDark` · `CustomLensWeb` · `CustomLensWebDark` | 390 × 844 · 1440 × 900 | Custom lens, reached from the bag's "Thêm ống kính"; back returns to the bag (there's no lens catalogue). Brand, name, focal length. A live preview of the bag row | [BAG-1](../product/requirements/bag.md) lenses |
| `Bag` · `BagDark` · `BagWeb` · `BagWebDark` | 390 × 1400 · 1440 × 1120 | The bag, "Túi": a film pocket (unshot rolls as canisters on a ledge), catalogue search entry, then film first (with a − / + count of unshot rolls per stock; at 0 the row reads "HẾT" and − becomes remove), cameras and lenses as rows with meta and roll counts, a "Riêng" stamp on custom entries, remove with undo, and add links (lenses go to the custom form). Bottom tab "Túi" active | [BAG-1](../product/requirements/bag.md) |
| `RollSaved` · `RollSavedDark` · `RollSavedWeb` · `RollSavedWebDark` | 390 × 1360 · 1440 × 1000 | Roll page after saving: "Đã lên kệ" banner, "Cuộn #16" with a name link, film data in mono, stamps (Chờ scan, Đẩy +1), the canister landing on the shelf, an `UploadDrop` for scans and a details list with "Sửa" | [ROLL-1, ROLL-2](../product/requirements/rolls.md); the drop zone is a placeholder until [SCAN-1](../product/requirements/scans.md) (Phase 2) |

Roll counts per stock (film chips show `×3`, the form says how many are left after saving, custom film asks "Đang có") are BAG-2, raised to P0 and moved into Phase 1 on 27.09.2026, drawn at Trúc's request on 27.09.2026; the MVP data model has no `qty` column yet (see [Known conflicts](../README.md#known-conflicts-between-sources) #6 and plan D1–D5). Custom and shop-rolled film is called "chiết" in the UI. Phase 1 decisions drawn into these boards: lenses are custom-only (plan D3), push/pull is computed and rounded to ⅓ stop (D17), and custom entries stay private (CAT-3's shared-directory toggle is left out). The boards use sample data from the `Profile` bag (Pentax K1000, Nikon FM2, Olympus mju II; Gold 200, Superia 400, HP5 Plus 400, Vision3 500T) plus one custom film and two lenses.

## Page "Scan & ghi chú" (scans and notes)

Phase 2 boards, four per screen (phone and desktop, Paper and Darkroom: `…Dark`, `…Web`, `…WebDark`). Drawn 27.09.2026 with the [Phase 2 plan](../../.planning/plans/phase-2-scans-and-notes.md)'s blocker defaults; the defaults and the boards were approved by Trúc on 30.09.2026. Frames reuse the canvas's sample photos.

| Artboards | Size | What it shows | PRD |
|---|---|---|---|
| `UploadScans` | 390 × 844 · 1440 × 960 | Upload list for Cuộn #16: totals line and bar, a "Lab nào tráng cuộn này?" prompt (desktop: lab, received date and a link to the full form beside the list), files grouped as needs-retry (with reason, "Thử lại" per file and "Thử lại tất cả"), uploading (% or "Đang tạo bản xem"), waiting and done. "Thu nhỏ" hands off to the tray | [SCAN-1, SCAN-2](../product/requirements/scans.md) |
| `UploadTray` | 390 × 844 · 1440 × 900 | The background tray over the Túi screen: uploading 12/36 with a bar, done ("Xong 36/36 · lên kệ rồi"), or "2 tấm lỗi" to retry. Phone: above the tabs; desktop: bottom right. A switch on the board (and the `view` tweak) shows each state | SCAN non-functional |
| `HomeUploading` | 390 × 1000 · 1440 × 1000 | Home with the tray, and the uploading roll's card stamped 12/36, then "36 tấm", or "2 lỗi" | [SCAN-2](../product/requirements/scans.md) |
| `UploadErrors` | 390 × 844 · 1440 × 900 | Three states: two TIFFs over 10 MB rejected before upload with name and size while the rest continue; connection lost (20/36 safe, retry the rest); finished with 3 failures, each with a reason and "Thử lại" | [SCAN-1, SCAN-2](../product/requirements/scans.md) |
| `ScanSetForm` | 390 × 844 · 1440 × 900 | "Lần scan này": lab and branch (opens `LabPicker`), received date (today). "Thêm chi tiết" folds drop-off date, process (C-41, E-6, Đen trắng, ECN-2), push/pull (from the roll), price in ₫, scanner, scan size and file format. Reachable while the upload runs | [LAB-3](../product/requirements/labs.md) |
| `RollFrames` | 390 × 1900 · 1440 × 1500 | Roll page with scans: title, stamps (36 tấm, tấm ưng, oops, đẩy +1), the scan-set line, a numbered frame grid (3 columns phone, 6 desktop) with tấm ưng and oops marks and a blank frame, memory and notes previews, "+ Thêm scan" | [SCAN-4](../product/requirements/scans.md), [NOTE-1](../product/requirements/notes.md) |
| `FrameView` | 390 × 844 · 1440 × 900 | One frame (2048 px copy) on film-coloured ground, "Tấm 14/36", previous and next, toggles for tấm ưng and tấm trắng, "Oops?", mistake stamps, this frame's notes, "Xem bản gốc 100%", "Đổi vị trí" | [SCAN-2](../product/requirements/scans.md) reorder, [SCAN-3, SCAN-4](../product/requirements/scans.md), [NOTE-1](../product/requirements/notes.md) |
| `MistakePicker` | 390 × 844 · 1440 × 900 | Over frame 5: "Tấm này / Cả cuộn", the 13 mistake types as multi-select chips, a note field per picked type, a preview with the oops stamp and a red scribble. Sheet on phone, panel on desktop | [NOTE-2](../product/requirements/notes.md) |
| `NotesMemory` | 390 × 1040 · 1440 × 900 | The roll's memory (autosaves, "Đã lưu 14:02"), timestamped notes with edit and delete, frame notes linking to their frame, and a composer | [NOTE-1](../product/requirements/notes.md) |

`RollSaved`'s drop-zone hint now reads "JPEG · PNG · WEBP · TỐI ĐA 10 MB" (it said TIFF). The drag-over colour lives in the design system's `UploadDrop`, not on the canvas.

## MVP screens with no artboard yet

The full list by phase, checked against canvas `6906`, is a checklist in [missing-screens.md](missing-screens.md).

Every new screen needs a design before it is built. These P0 areas have no dedicated artboard on the canvas yet:

- Canister shelf and canister editor ([CAN-1, CAN-2](../product/requirements/canister.md)). The `Home` board shows a RollCard list; CAN-1 asks for canisters on a shelf, and the PRD wins. The mobile roll page reference is `RollPage` in the [design system](design-system.md#mobile).
- Roll page in film-strip view for the owner ([COL-1](../product/requirements/collection.md))

## Reading an artboard

Each artboard is a `.dc.html` file under `project/` in the artifact. To pull one into the repo for reference: `Artifact read` with the canvas URL and `path: "project/<name>.dc.html"`. Artboards are interactive prototypes, not production code.
