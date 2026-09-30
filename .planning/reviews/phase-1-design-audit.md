# Phase 1 design audit: built screens vs boards

Audited 27.09.2026. Code: worktree `.claude/worktrees/phase-1-combined`, branch `feature/phase-1-log-a-roll` (PR #20). Boards: canvas `1790516511-f125`, 17 screens × phone (390) + desktop (1440), Paper only (Darkroom boards share markup). Context: [Phase 1 plan](../plans/phase-1-log-a-roll.md) (D1–D21, Design findings), `docs/roadmap.md`, `docs/product/requirements/*.md`, `src/db/schema/*`. Read-only on code.

## Summary

- **A · Phase 1 miss: 45** (38 S, 7 M; none needs a schema change, 2 have an optional column). Heaviest on the roll form (14 incl. past mode), roll page (7) and catalogue picker (6). Rough total ≈ 25 h; the top 10 fixes below ≈ 12 h.
- **B · later phase: 24.** BAG-2 film pocket (needs `bag_item.qty`), BAG-3 roll counts, LAB-3 scan sets, SCAN-1/4 and NOTE-2 counts, COL-1/3 grids, CAN-2, SHARE, AUTH-2.
- **C · board-only: 7.** Desktop "Lab" nav, per-film and per-lens roll counts, lens mount, camera nickname, roll options menu, language row. One more difference (bag undo vs confirm) is already decided and not counted.

Paths below are relative to the worktree root. Effort: S < 1 h, M 1–3 h, L > 3 h.

## Per screen

### App shell (all signed-in boards)
`src/components/app-shell/{AppShell,TopNav,BottomTabs}.tsx`

| # | Board shows | Built | Class | Req / phase | Effort | Schema? |
|---|---|---|---|---|---|---|
| G1 | Phone top bar: "Cuộn" wordmark + avatar "T" linking to Profile (`Home`, `Bag`) | Phone has no top bar; content starts at the h1 | A | D15 | S | No |
| G2 | Desktop nav: Kệ · Túi · Tấm ưng · **Lab** (→ `LabPickerWeb`) | No Lab item | C | No lab screen in Phase 1 (D13). Needs a `/labs` browse page hosting `LabPicker`, or drop the item from the boards | M | No |
| G3 | "Tấm ưng" tab / nav item → `LibraryGrid` | Disabled span | B | COL-3 Phase 3 (keepers from SCAN-4, Phase 2) | — | — |
| G4 | Focused flows have no tab bar: `NewRoll`, `PastRoll`, `RollSaved`, `CustomEntry` (phone) use a close ✕ or "‹ Kệ" instead | `/rolls/new` and `/rolls/[id]` render `BottomTabs` | A | ROLL-1 (60 s exit, screen space) | S | No |
| G5 | Desktop: "Kệ" active on the roll page, "Túi" active under custom entry; `NewRollWeb` hides the "Cuộn mới" button on its own page | Active state is exact-path only; nothing active on `/rolls/[id]`; "Cuộn mới" always shown | A | D15 | S | No |
| — | No theme switch in the desktop header | `ThemeToggle` added to `TopNav` (documented choice) | note | — | — | — |

### Home · `Home` / `HomeWeb`
`src/app/page.tsx`, `src/features/rolls/roll-card-mapper.ts`

| # | Board shows | Built | Class | Req / phase | Effort | Schema? |
|---|---|---|---|---|---|---|
| H1 | Desktop: `RollCard`s in a **2-column** grid | Single column at every width | A | D15 | S | No |
| H2 | Sort label "Mới nhất trước" beside the Kệ/Lưới toggle (left of it on desktop) | Missing | A | D15 | S | No |
| H3 | Count line "7 CUỘN · 214 TẤM · 27 TẤM ƯNG" (+ "· 7 OOPS" on desktop) | "N CUỘN" only | B | SCAN-1, SCAN-4, NOTE-2 · Phase 2 | S later | No |
| H4 | "Đang chờ scan · 1 cuộn / Cuộn #15 đang ở LLAB · gửi 20.10.25" card; desktop adds "Tải scan lên" | Missing | B | LAB-3 + SCAN-1 · Phase 2 (`scan_set` drop-off) | M | Yes (`scan_set`, Phase 2 table) |
| H5 | "Lưới" view: frames grouped by roll with keeper/oops marks | Toggle disabled | B | COL-3 · Phase 3 | — | — |
| H6 | `RollCard` oops and keeper counts | Not passed | B | NOTE-2, SCAN-4 · Phase 2 | — | — |
| H7 | `RollCard` opens `RollGrid` (roll with frames) | Opens `/rolls/[id]` (D15) | B | COL-1 · Phase 3 | — | — |

Unnamed rolls: boards name them "Cuộn #N"; built falls back to "Kodak Gold 200". See N1.

### Bag · `Bag` / `BagWeb`
`src/app/(app)/bag/page.tsx`, `src/features/bag/components/BagList.tsx`

| # | Board shows | Built | Class | Req / phase | Effort | Schema? |
|---|---|---|---|---|---|---|
| B1 | Pocket strip of drawn canisters (ISO on label) + scribble "N cuộn chờ nạp"; film subtitle "Nạp một cuộn là bớt một" | Missing | B | BAG-2 · v1.1b | M | Yes (`bag_item.qty`) |
| B2 | Film rows: −/count/+ stepper; ✕ only at 0; "HẾT" state | ✕ remove only | B | BAG-2 · v1.1b | M | Yes (`bag_item.qty`) |
| B3 | Film rows: "ĐÃ CHỤP 2 CUỘN" / "CHƯA CHỤP CUỘN NÀO" | Missing | C | No req (BAG-2 counts rolls *left*). Count `roll.stock_id` | S | No |
| B4 | Camera rows: "3 CUỘN" | Missing | B | BAG-3 · v1.1b (data exists: `roll.camera_bag_item_id`) | S | No |
| B5 | Lens rows: "2 CUỘN" | Missing | C | No req. Count `roll.lens_id` | S | No |
| B6 | Lens meta "50MM · NGÀM K" (mount) | Focal length only | C | No req; `lens` has no mount | S | Yes (`lens.mount`) |
| B7 | Counts in mono caps: "N CUỘN CHƯA CHỤP · N LOẠI FILM · N MÁY · N ỐNG KÍNH"; film heading "Film · 5 loại · 8 cuộn" | Sentence case "N loại film · N máy · N ống kính" | A (caps/order); the "cuộn" counts are B (BAG-2) | BAG-1 | S | No |
| B8 | Lens subtitle "Bạn tự thêm, chỉ mình bạn thấy" | Missing | A | BAG-1, D3 | S | No |
| B9 | Desktop header: title + pocket left, search box in a 380 px right column | Search sits under the title | A | BAG-1 | S | No |
| — | Remove: instant, toast "Đã bỏ X khỏi túi." + "Hoàn tác" | Confirm dialog, no undo | decided | Owner review Fix 3 → update the board | — | — |

### Catalogue picker · `CatalogueSearch` / `CatalogueEmpty` (+Web)
Dialog on `/bag` and `/rolls/new`: `src/features/catalogue/components/CataloguePicker.tsx`, `src/components/overlay/ResponsiveDialog.tsx`

| # | Board shows | Built | Class | Req / phase | Effort | Schema? |
|---|---|---|---|---|---|---|
| C1 | Result count "6 KẾT QUẢ CHO “400”" above the list | Missing | A | CAT-1 | S | No |
| C2 | No-match art: "?" canister + scribble "hiếm thật đấy" | Text only | A | CAT-1/CAT-2 | S | No |
| C3 | Row name "Gold 200"; meta "ISO 200 · KODAK · MÀU · 35MM" | Name "Kodak Gold 200"; type label "Màu âm" | A | CAT-1 | S | No |
| C4 | Phone sheet: no lead paragraph (desktop only) | Lead shown on phone too | A | — | S | No |
| C5 | Desktop: table with header row Tên · Hãng · loại · ISO · Định dạng | Same list rows as phone | A | CAT-1 | M | No |
| C6 | Desktop: pinned footer "Không thấy film của bạn? + Thêm film riêng" + "‹ Quay lại cuộn" | Inline link after the list; no back link | A | CAT-2 | S | No |

### Custom entry · `CustomEntry` / `CustomEntryWeb`
`src/features/catalogue/components/CustomEntryForm.tsx`

| # | Board shows | Built | Class | Req / phase | Effort | Schema? |
|---|---|---|---|---|---|---|
| E1 | Live canister preview (type colour + ISO) + scribble "vỏ cuộn của bạn" | Missing | A | CAT-2 | S | No |
| E2 | "Đang có" roll stepper, "Số cuộn chưa chụp." | Missing | B | BAG-2 · v1.1b | S | Yes (`bag_item.qty`) |
| E3 | Format options 35mm · 120 · **Khác** (stock and camera) | 35mm · 120 only | A | CAT-2 | S | No |
| E4 | Camera "Biệt danh" (e.g. "máy của bố"), hint about two identical bodies | Missing | C | PRD `BagItem.nickname`, no req ID | S–M | Yes (`bag_item.nickname`) |
| E5 | "‹ Quay lại" / desktop "‹ Quay lại danh mục" back to the picker | Close ✕ only | A | CAT-2 | S | No |
| E6 | Desktop: 2-column fields (brand \| name, ISO \| stepper, format \| type) | Single column | A | — | S | No |

### New roll · `NewRoll` / `NewRollQuick` (+Web)
`src/app/(app)/rolls/new/page.tsx`, `src/features/rolls/components/RollForm.tsx`

| # | Board shows | Built | Class | Req / phase | Effort | Schema? |
|---|---|---|---|---|---|---|
| N1 | Kicker "CUỘN #16"; name hint "Để trống thì gọi là Cuộn #16." (the default name) | No roll number; unnamed roll shows the stock name | A | ROLL-1 (conflicts with the mapper's reading of ROLL-1: settle it) | S | No if computed per user; a `roll.number` column if numbers must stay stable |
| N2 | Phone: close ✕ "Đóng, về kệ"; desktop "‹ Về kệ" | None | A | ROLL-1 | S | No |
| N3 | "+ Film khác" expands an **inline** catalogue search in the film fieldset: ≤5 hits, "Xem cả N kết quả trong danh mục", inline no-match + "+ Thêm film riêng", "Thôi, chọn trong túi" | Opens the full `CataloguePicker` dialog | A | ROLL-1, BAG-1 | M | No |
| N4 | A film picked from the catalogue gets a "mới" tag and a checkbox "Thêm {film} vào túi cho lần sau" (on by default) | Picking always adds to the bag | A | BAG-1 | S | No (`createRoll` doesn't need the stock in the bag) |
| N5 | Line under film: "ISO HỘP 200 · TỰ ĐIỀN TỪ FILM" | Missing ("· TÚI CÒN N CUỘN SAU KHI LƯU" is B, BAG-2) | A | ROLL-1 | S | No |
| N6 | Film chips show "×3" / "hết" | Missing | B | BAG-2 · v1.1b | S | Yes (`bag_item.qty`) |
| N7 | Details include "Ngày nạp" (defaults to today) and "Ngày chụp xong"; toggle hint lists "ngày" | No dates in new mode (`shot_from` = now, silently); hint omits "ngày" | A | ROLL-1 | S | No |
| N8 | Push/pull row always visible: "—" + "Điền ISO chụp để tính", "0 · chụp đúng ISO hộp", "+1 stop · đẩy khi tráng"; warning "Nhiều đấy. Đẩy +3 thật à?" at ≥3 stops | Value only when both ISOs are set; no words, no warning | A | ROLL-1, D17 | S | No |
| N9 | Locations hint "Gõ rồi nhấn Enter. Thêm mấy nơi cũng được." | Missing | A | ROLL-1 | S | No |
| N10 | Choosing 120 sets exposures to 12 | Blank | A | ROLL-1 | S | No |
| N11 | Phone: sticky bottom bar with summary "GOLD 200 · PENTAX K1000 · ISO 400" + "Lưu cuộn" | Plain button at the end, no summary | A | ROLL-1 (60 s exit) | S | No |
| N12 | Desktop: form left + aside "Sẽ lên kệ thế này · CUỘN #16" with live `RollCard` preview, scribble "đang nằm trong máy", summary with "ĐẨY/KÉO", "Lưu cuộn" + "Huỷ"; details open by default, 2-column | Single column, details collapsed, no preview | A | ROLL-1 | M | No |

### Past roll · `PastRoll` / `PastRollWeb`
Same files, `?mode=past`

| # | Board shows | Built | Class | Req / phase | Effort | Schema? |
|---|---|---|---|---|---|---|
| P1 | "Bước 1 / 2 · rồi tải scan" + progress bar | Missing | B | SCAN-1 · Phase 2 (step 2 doesn't exist yet) | S | No |
| P2 | Film: catalogue search first ("Tìm cả danh mục, film đã hết trong túi cũng được."), with "Film bạn từng dùng" quick picks | Bag chips, as in new mode | A | **ROLL-2 wording** ("searched in the whole catalogue first, films shot before as quick picks") | M | No (distinct `roll.stock_id`) |
| P3 | Legends "Film" / "Máy ảnh" (no "· trong túi"); line "ĐÃ CHỌN GOLD 200 · ISO HỘP 200" | New-mode legends; no line | A | ROLL-2 | S | No |
| P4 | "Chụp khoảng khi nào": Month select (+ "Không nhớ") and Year select (+ "Lâu hơn nữa"); card date "10.25" | Two required day pickers | A | ROLL-2 ("roughly when") | M | No if stored as a month/year range; "Không nhớ"/"Lâu hơn nữa" need nullable dates or a precision column; zod requires `shotFrom` today |

### Roll page · `RollSaved` / `RollSavedWeb`
`src/app/(app)/rolls/[id]/page.tsx`, `src/features/rolls/components/RollPage.tsx`

| # | Board shows | Built | Class | Req / phase | Effort | Schema? |
|---|---|---|---|---|---|---|
| R1 | "Đã lên kệ." banner as the just-saved state | Banner on every visit | A | D15 | S | No |
| R2 | Kicker "Cuộn 16", h1 "Cuộn #16", link "Đặt tên cho cuộn" when unnamed | h1 = stock name | A | ROLL-1 (with N1) | S | No |
| R3 | Meta lines "GOLD 200 · ISO 200 → 400 · 36 EXP / PENTAX K1000 · NẠP 27.09.26 · ĐÀ LẠT" | Missing | A | D15 | S | No |
| R4 | "Sửa" in the banner and details ("Sửa chi tiết" on desktop) → edit the roll | No edit route or action (the `edit` string is unused). The form lead promises "điền sau cũng được" | A | ROLL-1 | M | No (`version` exists) |
| R5 | "Tuỳ chọn cuộn" menu button | Missing | C | No req defines its contents (delete? share?) | S–M | No |
| R6 | Drawn canister (stock colour, ISO) + scribble "lên kệ rồi ≧ω≦" | Missing | B | CAN-2 · Phase 3 (a static stock-colour canister is S now) | S | No |
| R7 | Scan section: `UploadDrop` "Thả scan của cuộn này", "JPEG · PNG · WEBP · TỐI ĐA 10 MB…", "Chưa có scan cũng không sao…" | "Sắp có" placeholder (D14) | B | SCAN-1/2 · Phase 2 | — | — |
| R8 | Stamp "Đẩy +1" | "+1" | A | D17 | S | No |
| R9 | Details: "Film: Gold 200 · ISO 200", "Định dạng: 35mm · 36 kiểu" | Format without exposures | A | ROLL-1 | S | No |
| R10 | Desktop 2-column: title, meta, details left; canister, scan right | Single column | A | D15 | S | No |

### Profile · `Profile` / `ProfileWeb`
`src/app/(app)/profile/{page,ProfileContent}.tsx` (F4 was scoped down on purpose; items below are what's now buildable)

| # | Board shows | Built | Class | Req / phase | Effort | Schema? |
|---|---|---|---|---|---|---|
| PR1 | Stat tile "7 cuộn" | Missing | A | D15 (data exists) | S | No |
| PR2 | Stat tiles "27 tấm ưng", "7 oops" | Missing | B | SCAN-4, NOTE-2 · Phase 2 | — | — |
| PR3 | "Túi của tôi" (cameras, film swatches) + "Sửa túi" → `/bag`; desktop right column | Missing; desktop right column is empty | A | BAG-1 (D2 has landed) | S–M | No |
| PR4 | Camera roll counts "3 CUỘN" in that list | — | B | BAG-3 · v1.1b | S | No |
| PR5 | "Tấm ưng gần đây" + "Xem hết 27" | Missing | B | SCAN-4 Phase 2 / COL-3 Phase 3 | — | — |
| PR6 | "Ngôn ngữ · Tiếng Việt ›" | Missing | C | No req; UI is Vietnamese only. Drop, or show as static text | S (static) / L (2nd locale) | No |
| PR7 | "Link đang chia sẻ · 3 link ›" | Missing | B | SHARE-1 Phase 4 / SHARE-6 v1.1a | — | — |
| PR8 | "Xoá tài khoản" | Missing | B | AUTH-2 · v1.1a | — | — |

### Onboarding · `OnboardBag` / `OnboardFirst` (+Web)
`src/app/(onboarding)/onboarding/{bag,first-roll}/*`, `src/components/onboarding/OnboardingFrame.tsx`

No structural, copy or navigation gaps. Step labels, chips, "+ Máy khác / + Film khác", skip, footer hint and desktop header/footer all match.

### Lab picker · `LabPicker` / `LabPickerWeb`
`src/app/dev/labs/*`, `src/features/labs/components/LabPicker.tsx`

| # | Board shows | Built | Class | Req / phase | Effort | Schema? |
|---|---|---|---|---|---|---|
| L1 | h1 "Tráng ở lab nào?" under the "Cuộn #14 · Gold 200" kicker | Kicker only | A | LAB-1 | S | No |
| L2 | "đã gửi 4 cuộn" per lab | Missing | B | LAB-3 · Phase 2 | S later | Yes (`scan_set`) |
| L3 | Host: sheet/dialog over a roll (desktop: roll header, `FilmStrip`, "Đóng") | Standalone on `/dev/labs` (D13) | B | LAB-3 · Phase 2 (design finding 3: +~2 h to pull forward) | M | Yes (`scan_set`) |
| L4 | One row per lab, branches joined ("Q.1 · Q.3, TP.HCM · Giảng Võ, Hà Nội") | One row per branch (deliberate: the branch is what's picked) | A | LAB-1 | S | No: update the board or merge rows |

### Add lab · `LabAdd` / `LabAddWeb`
`src/features/labs/components/LabAddForm.tsx`

| # | Board shows | Built | Class | Req / phase | Effort | Schema? |
|---|---|---|---|---|---|---|
| LA1 | Toggle "Gửi lên danh bạ lab chung" + note | Left out (design finding 2) | B | CAT-3 · v1.1b | — | — |
| LA2 | Desktop: "‹ Quay lại danh sách lab" beside "Lưu lab" in the footer | Back link at the top | A | LAB-2 | S | No |
| — | No phường field | Extra "Phường (không bắt buộc)" (D5) | note | — | — | — |

### Sign-up profile · `SignupProfile` / `SignupProfileWeb`
`src/app/(auth)/sign-up/profile/ProfileContent.tsx`

| # | Board shows | Built | Class | Req / phase | Effort | Schema? |
|---|---|---|---|---|---|---|
| S1 | Phone scribble "đổi tên lúc nào cũng được" | Missing | A | AUTH-1 | S | No |

### Grids · `LibraryGrid` / `RollGrid` (+Web)

| # | Board shows | Built | Class | Req / phase | Effort | Schema? |
|---|---|---|---|---|---|---|
| X1 | `LibraryGrid`: every frame, filter, "Xem cả cuộn ›" | No route | B | COL-3, COL-2 · Phase 3 | L | Phase 2 tables |
| X2 | `RollGrid`: Dải phim/Lưới switch, select-many, mark Tấm ưng/Oops/Tấm trắng, share | No route | B | COL-1, COL-4 · Phase 3; SHARE-1 · Phase 4 | L | Phase 2 tables |

## Screens on the boards with no route

| Board | Linked from | Status |
|---|---|---|
| `LibraryGrid` / `LibraryGridWeb` | "Tấm ưng" tab/nav, Home "Lưới" | B · COL-3, Phase 3 |
| `RollGrid` / `RollGridWeb` | Every `RollCard` on Home | B · COL-1/COL-4, Phase 3 |
| `LabPicker` / `LabAdd` as product screens | Desktop "Lab" nav (C), a roll's drop-off step | Built only on `/dev/labs` (D13); host is LAB-3, Phase 2 |
| Scan boards (`UploadScans` etc., "Scan & ghi chú" page) | HomeWeb "Tải scan lên", `RollSaved` `UploadDrop`, `PastRoll` step 2 | Phase 2 |
| `Login`, `Signup` (+Dark/Web) | Auth | Routes exist (`/sign-in`, `/sign-up`); not in this audit set |

`CatalogueSearch`, `CatalogueEmpty` and `CustomEntry` are overlays on the boards and are built as `ResponsiveDialog`s, so they need no route.

## Routes (or states) with no board

- `/profile/name` (`NameForm`): the Profile board only shows the "Sửa tên hiển thị ›" row.
- `/rolls/[id]` revisited (not just saved) and its not-found state: `RollSaved` covers only the moment after saving.
- Home empty state (`/` with 0 rolls) and Bag empty state: built, never drawn.
- `/privacy`, `/terms`: no boards.
- `/dev/catalogue`, `/dev/design-system`, `/dev/labs`: dev only.

## Suggested Phase 1 fix list (class A)

Ordered by impact on the 60 s log-a-roll exit, then on first impressions.

1. **N11** sticky save bar with summary (phone), and **G4** + **N2**: no tab bar on the roll form and roll page, close ✕ instead. Save stays in reach without scrolling. (S+S+S)
2. **N3** + **N4**: inline "+ Film khác" search inside the form, with the "add to bag for next time" checkbox. A film missing from the bag no longer costs a dialog round trip. (M+S)
3. **P2** + **P4** + **P3**: past roll catalogue-first with "Film bạn từng dùng", and month/year dates. ROLL-2 as written, and it is how a new user fills the shelf on day one. (M+M+S)
4. **N1** + **R2**: "Cuộn #N" numbering and default name (settle the ROLL-1 reading first). (S+S)
5. **N5**, **N7**, **N8**, **N9**, **N10**: small form fixes (box-ISO line, dates in new mode, push/pull words and warning, hints, 120 → 12). (5×S)
6. **R1**, **R3**, **R8**, **R9**, then **R4**: roll page banner only after saving, meta lines, stamp copy, edit roll. (4×S + M)
7. Desktop layouts: **H1** (2-column shelf), **N12** (form + preview aside), **R10**, **C5** + **C6**, **E6**, **B9**. (M+M+S+M+S+S+S)
8. **G1** phone top bar, **G5** active nav state. (S+S)
9. **PR3** + **PR1**: "Túi của tôi" and the roll count on Profile, filling the empty desktop column. (S–M+S)
10. Copy and state polish: **C1–C4**, **E1**, **E3**, **E5**, **B7**, **B8**, **H2**, **L1**, **L4**, **LA2**, **S1**. (all S)

## Decisions for the owner

| Item | What it pulls forward | Cost |
|---|---|---|
| **BAG-3 roll counts** (B4, PR4) | Camera "N CUỘN" on Bag and Profile. Data already exists | S, no schema. Cheap win |
| **Per-film and per-lens shot counts** (B3, B5; C) | "ĐÃ CHỤP N CUỘN" on films, "N CUỘN" on lenses. No requirement names them | S, no schema. Add to BAG-1/BAG-3 wording if kept |
| **BAG-2 film pocket** (B1, B2, B7 counts, E2, N5 tail, N6) | Quantity steppers, pocket strip, "×3/hết" chips, "túi còn N", "Đang có" in custom entry, decrement on save | M–L (~4–5 h) across 4 screens. **Schema:** `bag_item.qty` (+ `expiry_year` if done fully). Plan listed this as v1.1b |
| **LAB-3 drop-off now** (H4, L2, L3) | Lab picker hosted on a roll ("Gửi lab"), Home "Đang chờ scan" card, "đã gửi N cuộn" | +~2 h for `scan_set` (design finding 3) + S–M for the Home card. **Schema:** `scan_set` early |
| **Desktop "Lab" nav** (G2; C) | A lab directory page | M. Or remove the item from the boards |
| **Camera nickname** (E4; C) | "Biệt danh" to tell identical bodies apart (D2) | S–M. **Schema:** `bag_item.nickname` |
| **Lens mount** (B6; C) | "NGÀM K" in lens meta + a field in custom entry | S. **Schema:** `lens.mount` |
| **Roll options menu** (R5; C) | Needs defined contents (delete roll? share is Phase 4) | S–M once decided |
| **Language row** (PR6; C) | Second locale | Drop from the board, or static text (S); a real locale is L |
| **Drawn canister** (R6; B, CAN-2) | Static stock-coloured canister on the roll page now; customising stays Phase 3 | S now |
| **Past-roll step indicator** (P1; B) | "Bước 1 / 2" before step 2 exists | S. Better to ship it with Phase 2 upload |
| **Stable roll numbers** (N1) | Computed per user vs stored | Computed: no schema, but numbers shift after a delete. Stored: `roll.number` column |
| **Month-precision dates** (P4) | "Không nhớ" / "Lâu hơn nữa" | Month range needs no schema; unknown dates need nullable past-mode dates or a precision column |
| **Board updates, no code** | Bag remove: confirm (built, Fix 3) vs undo toast (board); LabPicker per-branch vs per-lab rows (L4); desktop `ThemeToggle` in `TopNav` | Update the canvas to match, or reopen |
