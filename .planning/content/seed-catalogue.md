# Seed data: catalogue and labs (draft)

Candidate rows for the seeded catalogue ([CAT-1](../../docs/product/requirements/catalogue.md)) and lab directory ([LAB-1](../../docs/product/requirements/labs.md)). P1-A in the [Phase 1 plan](../plans/phase-1-log-a-roll.md) turns the approved rows into `data/catalogue/{stocks,cameras,labs}.json`.

- **Status:** draft by Claude, 27.09.2026, from general film knowledge. Stocks and cameras are taken as listed, with no per-shop "sold in Vietnam" check (Trúc, 27.09.2026). Labs still need checking before they ship (roadmap content track, due 01.11.2026).
- **Starter rows** (★: 19 stocks, 10 cameras; labs as proposed below) are what the plan seeds first (D11), so the build and the Phase 1 exit have real-shaped data before the content track finishes.
- **How to review:** strike rows you don't want and add what's missing. For labs, fill the `Check` column: a lab row ships only once it's ✓.

## Columns

| Field | Values | Maps to |
|---|---|---|
| `slug` | `brand-name-iso`, lowercase, ASCII | Natural key for the idempotent upsert (plan D10) |
| `type` | `color-negative` · `slide` · `bw` · `cine` · `special-effect` · `instant` | `stock.type` |
| `process` | `C-41` · `E-6` · `B&W` · `ECN-2` | Matches LAB-2 services, so a lab's services can be matched to a stock |
| `formats` | `35mm`, `120` | `stock.formats text[]` (plan D4) |
| `canister` | `gold` · `green` · `blue` · `mono` · `rose` | Default `stock-*` colour family ([design system](../../docs/design/design-system.md#colour)): gold = warm colour negative, green = cool colour negative, blue = slide, mono = B&W, rose = everything else |
| `status` | `current` · `discontinued` | Discontinued stocks stay in: past rolls (ROLL-2) use them |
| `search_text` | not in the data | Computed on write by `toSearchText()` (plan D8) |

## Film stocks (50 major + 58 small brands)

### Colour negative, C-41

| ★ | Brand | Name | ISO | Formats | Canister | Status |
|---|---|---|---|---|---|---|
| ★ | Kodak | Gold 200 | 200 | 35mm, 120 | gold | current |
| ★ | Kodak | ColorPlus 200 | 200 | 35mm | gold | current |
| ★ | Kodak | UltraMax 400 | 400 | 35mm | gold | current |
| ★ | Kodak | Portra 160 | 160 | 35mm, 120 | gold | current |
| ★ | Kodak | Portra 400 | 400 | 35mm, 120 | gold | current |
| | Kodak | Portra 800 | 800 | 35mm, 120 | gold | current |
| ★ | Kodak | Ektar 100 | 100 | 35mm, 120 | rose | current |
| | Kodak | Pro Image 100 | 100 | 35mm | gold | current |
| | Kodak | Kodacolor 100 | 100 | 35mm | gold | current |
| | Kodak | Kodacolor 200 | 200 | 35mm | gold | current |
| ★ | Fujifilm | Superia X-TRA 400 | 400 | 35mm | green | current (check) |
| ★ | Fujifilm | Fujicolor C200 | 200 | 35mm | green | discontinued |
| | Fujifilm | Fujicolor 200 | 200 | 35mm | green | current |
| | Fujifilm | Fujifilm 400 | 400 | 35mm | green | current |
| | Fujifilm | Pro 400H | 400 | 35mm, 120 | green | discontinued |
| | Lomography | Color Negative 100 | 100 | 35mm, 120 | gold | current |
| | Lomography | Color Negative 400 | 400 | 35mm, 120 | gold | current |
| | Lomography | Color Negative 800 | 800 | 35mm, 120 | gold | current |
| | Lomography | LomoChrome Purple | 400 | 35mm, 120 | rose | current |
| | Lomography | LomoChrome Metropolis | 400 | 35mm, 120 | rose | current |
| | Harman | Phoenix 200 | 200 | 35mm | rose | current |
| | Agfa | Vista Plus 200 | 200 | 35mm | gold | discontinued |
| | Kodak | 800 (FunSaver film) | 800 | 35mm | gold | current, single-use only |

### Cine, ECN-2 (and C-41 conversions)

Kodak's Vision3 and CineStill here; branded re-spools (Reflx Lab, Candido…) are under [Small and boutique brands](#small-and-boutique-brands). Film a shop rolls and labels itself stays a custom entry (CAT-2).

| ★ | Brand | Name | ISO | Formats | Process | Canister |
|---|---|---|---|---|---|---|
| ★ | Kodak | Vision3 500T | 500 | 35mm | ECN-2 | rose |
| | Kodak | Vision3 250D | 250 | 35mm | ECN-2 | rose |
| | Kodak | Vision3 200T | 200 | 35mm | ECN-2 | rose |
| | Kodak | Vision3 50D | 50 | 35mm | ECN-2 | rose |
| ★ | CineStill | 800T | 800 | 35mm, 120 | C-41 | rose |
| | CineStill | 400D | 400 | 35mm, 120 | C-41 | rose |
| | CineStill | 50D | 50 | 35mm, 120 | C-41 | rose |

### Slide, E-6

| ★ | Brand | Name | ISO | Formats | Canister |
|---|---|---|---|---|---|
| | Kodak | Ektachrome E100 | 100 | 35mm, 120 | blue |
| | Fujifilm | Velvia 50 | 50 | 35mm, 120 | blue |
| | Fujifilm | Velvia 100 | 100 | 35mm, 120 | blue |
| | Fujifilm | Provia 100F | 100 | 35mm, 120 | blue |

### Black and white

| ★ | Brand | Name | ISO | Formats | Process | Canister |
|---|---|---|---|---|---|---|
| ★ | Ilford | HP5 Plus | 400 | 35mm, 120 | B&W | mono |
| | Ilford | FP4 Plus | 125 | 35mm, 120 | B&W | mono |
| | Ilford | Delta 100 | 100 | 35mm, 120 | B&W | mono |
| | Ilford | Delta 400 | 400 | 35mm, 120 | B&W | mono |
| | Ilford | Delta 3200 | 3200 | 35mm, 120 | B&W | mono |
| | Ilford | Pan F Plus | 50 | 35mm, 120 | B&W | mono |
| | Ilford | XP2 Super | 400 | 35mm, 120 | **C-41** | mono |
| ★ | Kentmere | Pan 400 | 400 | 35mm | B&W | mono |
| | Kentmere | Pan 100 | 100 | 35mm | B&W | mono |
| ★ | Kodak | Tri-X 400 | 400 | 35mm, 120 | B&W | mono |
| | Kodak | T-Max 100 | 100 | 35mm, 120 | B&W | mono |
| | Kodak | T-Max 400 | 400 | 35mm, 120 | B&W | mono |
| | Kodak | T-Max P3200 | 3200 | 35mm | B&W | mono |
| | Fujifilm | Neopan Acros 100 II | 100 | 35mm, 120 | B&W | mono |
| | Foma | Fomapan 100 | 100 | 35mm, 120 | B&W | mono |
| | Foma | Fomapan 400 | 400 | 35mm, 120 | B&W | mono |

### Small and boutique brands

Researched online 27.09.2026 (Trúc asked for Reflx Lab, Aeronega, Rosfilm and similar). Sources: makers' own shops where possible (H), otherwise shop listings (M). "What it is" is kept as a note for the stock page later, not a column in the MVP. Most are 35mm re-spools of cine or aerial film. **Rosfilm is low confidence**: no maker site, and Vietnamese sellers describe it as a Chinese re-spool of an unknown 400 stock.

| ★ | Brand | Name | ISO | Type | Process | Formats | Canister | What it is | Status | Conf. |
|---|---|---|---|---|---|---|---|---|---|---|
| | Reflx Lab | 50D AHU | 50 | color-negative | C-41 | 35mm | gold | Vision3 5203 with AHU backing | current | H |
| ★ | Reflx Lab | 320D AHU | 320 | cine | C-41 or ECN-2 | 35mm | rose | cine film with AHU backing, no remjet | current | H |
| ★ | Reflx Lab | 640T AHU | 640 | cine | C-41 or ECN-2 | 35mm | rose | tungsten, AHU backing | current | H |
| | Reflx Lab | 250D | 250 | cine | ECN-2 (remjet on) | 35mm | rose | Vision3 5207 | current | H |
| | Reflx Lab | 5203 50D | 50 | cine | ECN-2 (remjet on) | 35mm | rose | Vision3 5203 | current | H |
| | Reflx Lab | 500T | 500 | cine | ECN-2 (remjet on) | 120 | rose | 65mm Vision3 re-spooled | current | H |
| | Reflx Lab | 200T | 200 | cine | ECN-2 (remjet on) | 120 | rose | 65mm Vision3 re-spooled | current | H |
| | Reflx Lab | 50D | 50 | cine | ECN-2 (remjet on) | 120 | rose | 65mm Vision3 re-spooled | current | H |
| ★ | Reflx Lab | 800T | 800 | cine | C-41 | 35mm | rose | Vision3 5219, remjet removed (older reviews) | discontinued | M |
| | Reflx Lab | 400D | 400 | cine | C-41 | 35mm | rose | Vision3 250D, remjet removed (older reviews) | discontinued | M |
| | Reflx Lab | 200T | 200 | cine | C-41 | 35mm | rose | | discontinued | M |
| | Reflx Lab | Pro 100 | 100 | color-negative | C-41 | 120 | gold | Aerocolor 2460 | current | H |
| | Reflx Lab | Double X | 250 | bw | B&W | 35mm | mono | Eastman Double-X 5222 | current | H |
| | Reflx Lab | PAN200 Infrared | 200 | bw | B&W | 120 | mono | Agfa Aviphot | current | H |
| | Reflx Lab | Diablo 100 | 100 | special-effect | C-41 | 35mm | rose | redscale | current | H |
| | Reflx Lab | Zarya 100 | 100 | bw | B&W | 35mm | mono | Svema NK-2S | current | H |
| | Reflx Lab | Zarya 400 | 400 | bw | B&W | 35mm | mono | Svema Type 42 | current | H |
| ★ | Alien Film | Aeronega 100 | 100 | color-negative | C-41 | 35mm, 120 | gold | Kodak Aerocolor IV | current | M |
| ★ | Rosfilm | 400 | 400 | color-negative | C-41 | 35mm | gold | unknown 400 re-spool; also sold as "Rosfilm Ultramax 400" | current | **L** |
| | SantaColor | 100 | 100 | color-negative | C-41 | 35mm | gold | Aerocolor IV | current | M |
| | SantaColor | 800 | 800 | color-negative | C-41 | 35mm | gold | | current | M |
| | Candido | 50 | 50 | cine | C-41 | 35mm | rose | Vision3, remjet removed | current | H |
| | Candido | 200 | 200 | cine | C-41 | 35mm | rose | Vision3, remjet removed | current | H |
| | Candido | 400 | 400 | cine | C-41 or ECN-2 | 35mm | rose | Vision3 250D, remjet removed | current | H |
| | Candido | 800 | 800 | cine | C-41 | 35mm | rose | Vision3 500T, remjet removed | current | H |
| | dubblefilm | Cinema | 800 | cine | C-41 | 35mm | rose | remjet removed | current | M |
| ★ | Lucky | C200 | 200 | color-negative | C-41 | 35mm, 120 | gold | | current | M |
| | Lucky | C400 | 400 | color-negative | C-41 | 35mm, 120 | gold | | current (new 07.2026) | M |
| | Lucky | SHD 100 | 100 | bw | B&W | 35mm, 120 | mono | | current | M |
| | Lucky | SHD 400 | 400 | bw | B&W | 35mm, 120 | mono | | current | M |
| | Wolfen | NC400 | 400 | color-negative | C-41 | 35mm | gold | | current | H |
| | Wolfen | NP100 | 100 | bw | B&W | 35mm | mono | | limited run | H |
| | Wolfen | P400 | 400 | bw | B&W | 35mm | mono | was NP400 | current | H |
| | Wolfen | UN54 | 100 | bw | B&W | 35mm | mono | cine-derived | current | H |
| | Harman | Phoenix II | 200 | color-negative | C-41 | 35mm, 120 | rose | | current | M |
| | Adox | CMS 20 II | 12 | bw | B&W | 35mm, 120 | mono | | current | M |
| | Adox | CHS 100 II | 100 | bw | B&W | 35mm, 120 | mono | | current | M |
| | Adox | Scala 50 | 50 | bw | B&W reversal | 35mm | mono | same film as HR-50 | current | M |
| | Adox | Color Mission 200 | 200 | color-negative | C-41 | 35mm | gold | finite batch | discontinued | M |
| | Rollei | RPX 25 | 25 | bw | B&W | 35mm, 120 | mono | | current | H |
| | Rollei | RPX 100 | 100 | bw | B&W | 35mm, 120 | mono | | current | H |
| | Rollei | RPX 400 | 400 | bw | B&W | 35mm, 120 | mono | | current | H |
| | Rollei | Retro 80S | 80 | bw | B&W | 35mm, 120 | mono | | current | H |
| | Rollei | Retro 400S | 400 | bw | B&W | 35mm, 120 | mono | | current | H |
| | Rollei | Superpan 200 | 200 | bw | B&W | 35mm, 120 | mono | | current | H |
| | Kosmo Foto | Mono | 100 | bw | B&W | 35mm, 120 | mono | | current | H |
| | Kosmo Foto | Agent Shadow | 400 | bw | B&W | 35mm | mono | | current | H |
| | Ferrania | P30 | 80 | bw | B&W | 35mm, 120 | mono | | current | M |
| | Ferrania | P33 | 160 | bw | B&W | 35mm | mono | | current | M |
| | Lomography | Lady Grey | 400 | bw | B&W | 35mm, 120 | mono | | current | M |
| | Lomography | Earl Grey | 100 | bw | B&W | 35mm, 120 | mono | | current | M |
| | Lomography | Berlin Kino | 400 | bw | B&W | 35mm, 120 | mono | cine stock | current | M |
| | Lomography | Potsdam Kino | 100 | bw | B&W | 35mm | mono | cine stock | current | M |
| | Street Candy | ATM400 | 400 | bw | B&W | 35mm | mono | surveillance film | current | M |
| | Svema (FPP) | Foto 100 | 100 | bw | B&W | 35mm | mono | | current | M |
| | Svema (FPP) | Foto 400 | 400 | bw | B&W | 35mm | mono | | current | M |
| | KONO! | Delight ART 100 | 100 | color-negative | | 35mm, 120 | rose | | current | H |
| | KONO! | Delight ART 400 | 400 | color-negative | | 35mm, 120 | rose | | current | H |

**Held back** (no box ISO per film in the sources, so they can't be seeded yet; users can add them as custom entries): Revolog (13 effect films, 200 or 400), dubblefilm effect films (Apollo, Bubblegum, Pacific, Jelly, Solar, Stereo), Yodica (7 films at 400, confirm each), the rest of KONO!, Washi X, Rollei Infrared (ISO given as a range), Rollei Blackbird, Kosmo Foto Direktor, Street Candy MTN100 and Tasty 200, Tasma NK-2, and Wolfen NC500 (probably discontinued). Silberra is skipped because its domain now points to an unrelated site.

**Same film under several names:** Aerocolor IV is sold as Aeronega 100, SantaColor 100, Washi X, Reflx Pro 100 and others. Eastman Double-X 5222 is sold as Reflx Double X, Kosmo Direktor and Cinefoto BW XX (Thường Xanh). They stay separate rows because shooters log what's on the box.

**Links not to use:** filmferrania.it and Silberra's old domain both redirect to unrelated sites.

## Cameras (46)

`type`: `slr` · `rangefinder` · `point-and-shoot` · `half-frame` · `tlr` · `medium-format` · `toy` · `single-use`. `format` is what the camera takes. Half-frame matters for exposures (72 on a 36-exposure roll).

### Point-and-shoot

| ★ | Brand | Model | Format |
|---|---|---|---|
| ★ | Canon | AF35M (Autoboy) | 35mm |
| ★ | Olympus | mju II | 35mm |
| | Olympus | mju I | 35mm |
| | Olympus | Trip 35 | 35mm |
| ★ | Konica | Big Mini | 35mm |
| | Konica | C35 | 35mm |
| | Yashica | T4 | 35mm |
| | Nikon | L35AF | 35mm |
| | Pentax | Espio Mini | 35mm |
| | Contax | T2 | 35mm |
| | Kodak | M35 | 35mm |

### Half-frame

| ★ | Brand | Model | Format |
|---|---|---|---|
| ★ | Kodak | Ektar H35 | 35mm |
| | Pentax | 17 | 35mm |
| | Olympus | Pen EE-3 | 35mm |
| | Olympus | Pen FT | 35mm |

### SLR

| ★ | Brand | Model | Format |
|---|---|---|---|
| ★ | Pentax | K1000 | 35mm |
| | Pentax | MX | 35mm |
| ★ | Nikon | FM2 | 35mm |
| | Nikon | FM | 35mm |
| | Nikon | FE | 35mm |
| | Nikon | F3 | 35mm |
| | Nikon | F100 | 35mm |
| ★ | Canon | AE-1 Program | 35mm |
| | Canon | AE-1 | 35mm |
| | Canon | EOS 3000 | 35mm |
| ★ | Minolta | X-700 | 35mm |
| | Minolta | X-300 | 35mm |
| | Olympus | OM-1 | 35mm |
| | Olympus | OM-10 | 35mm |
| | Zenit | 12XP | 35mm |
| | Praktica | MTL 5 | 35mm |

### Rangefinder

| ★ | Brand | Model | Format |
|---|---|---|---|
| | Canon | Canonet QL17 GIII | 35mm |
| | Yashica | Electro 35 | 35mm |
| | Olympus | 35 RC | 35mm |
| | Leica | M6 | 35mm |

### Single-use

The camera comes loaded, so it carries a **fixed film**: picking it in the roll form fills the film too (Trúc, 27.09.2026). This needs a nullable `camera.fixed_stock_id`, and each fixed film must exist as a stock row. ISO and exposure counts are from memory: check them on the box.

| ★ | Brand | Model | Fixed film | ISO | Exposures |
|---|---|---|---|---|---|
| ★ | Kodak | FunSaver | Kodak 800 (new stock row, single-use only) | 800 | 27 |
| | Fujifilm | QuickSnap Flash 400 | Superia X-TRA 400 | 400 | 27 |
| | Ilford | HP5 Plus Single Use | HP5 Plus | 400 | 27 |
| | Ilford | XP2 Super Single Use | XP2 Super | 400 | 27 |
| | Lomography | Simple Use (Color Negative) | Color Negative 400 | 400 | 27 |

### Medium format and toy

| ★ | Brand | Model | Type | Format |
|---|---|---|---|---|
| ★ | Yashica | Mat-124G | tlr | 120 |
| | Seagull | 4A-103 | tlr | 120 |
| | Mamiya | RB67 | medium-format | 120 |
| | Pentax | 67 | medium-format | 120 |
| | Holga | 120N | toy | 120 |
| | Lomography | Diana F+ | toy | 120 |

## Labs

Researched online 27.09.2026 for TP.HCM, Hà Nội, Đà Nẵng and Đà Lạt. **Every row needs your check before it ships** (B3b seeds only ✓ rows). Most labs' Facebook pages wouldn't load, so most confidence is "medium", taken from the labs' own websites or third-party posts from 2024–2026. Services are listed only where a source stated them; blanks mean unknown, not "no".

**The design board's sample data was partly wrong.** LLab Giảng Võ is in Đống Đa, not Ba Đình. Cinephile has no TP.HCM branch, only drop-off points that send film to Đà Lạt. "47+" is **47plus minilab** in Tân Định, Q.1.

### Proposed seed (★ = medium or high confidence, a real lab, not a drop-off)

| ★ | Lab | Branch | Area (old quận / new phường) | City | Address | Services (sourced) | By post | Link | Conf. | Check |
|---|---|---|---|---|---|---|---|---|---|---|
| ★ | LLab | Q.1 | Q.1 · Cầu Ông Lãnh | TP.HCM | 365F Trần Hưng Đạo **or** 8B Hồ Hảo Hớn (the site uses both) | C-41, E-6, B&W, ECN-2 | Yes, to 365F Trần Hưng Đạo | [llab.vn](https://llab.vn/all-labs) | medium | |
| ★ | LLab | Q.3 | Q.3 · P.14 | TP.HCM | 386/27 Lê Văn Sỹ | develop + scan | | [llab.vn](https://llab.vn/all-labs) | medium | |
| ★ | LLab | Giảng Võ | Đống Đa · Ô Chợ Dừa | Hà Nội | Số 27 ngõ 189 Giảng Võ | C-41, E-6, B&W, ECN-2 | Yes | [llab.vn](https://llab.vn/all-labs) | high | |
| ★ | Croplab | Phú Nhuận | Phú Nhuận · P.14 | TP.HCM | 525/74 Huỳnh Văn Bánh | C-41, B&W | | [croplab.vn](https://croplab.vn/homepage) | medium | |
| ★ | Croplab | Hà Nội | Đống Đa (one list says Ba Đình) | Hà Nội | 102A3 ngõ 72 Nguyễn Chí Thanh | C-41, B&W, cine | Yes (135 only, 2021 source) | [fb.com/CroplabHaNoi](https://facebook.com/CroplabHaNoi) | medium | |
| ★ | Croplab | Đà Lạt | Phường 4 | Đà Lạt | 45 Thiện Ý | C-41, B&W | No | [croplab.vn](https://croplab.vn/homepage) | medium | |
| ★ | Cinephile FilmLab | Đà Lạt | Phường 3 | Đà Lạt | 2 Hà Huy Tập | C-41, B&W, ECN-2 (E-6 per its price list, Hà Nội research) | Mail-in by Hà Nội shooters reported, no official page | [fb.com/cinephilefilmlabdalat](https://facebook.com/cinephilefilmlabdalat) | medium | |
| ★ | 47plus minilab (47+) | Tân Định | Q.1 · Tân Định | TP.HCM | 214/19/8 bis Nguyễn Văn Nguyễn | C-41, B&W (cine reported, not confirmed) | | [fb.com/47plusminilab](https://facebook.com/47plusminilab) | medium | |
| ★ | Thường Xanh Film Store | Q.3 | Q.3 · Võ Thị Sáu | TP.HCM | 193/8 Nam Kỳ Khởi Nghĩa | C-41, B&W, ECN-2 | Yes | [thuongxanhfilmstore.vn](https://thuongxanhfilmstore.vn/pages/trang-scan-c-41) | medium | |
| ★ | Aeg Lab | Bạch Mai | Hai Bà Trưng | Hà Nội | 418 Bạch Mai | C-41, B&W, cine | Yes (2021 source) | [fb.com/AegLab](https://facebook.com/AegLab) | medium | |
| ★ | Chiu Lab | Hàng Lược | Hoàn Kiếm | Hà Nội | ngõ 19 Hàng Lược | C-41, B&W, cine | | [fb.com/chiulabhn](https://facebook.com/chiulabhn) | medium ("often closed", 03.2026) | |
| ★ | Nadar Lab (Nadar Photo Club) | Trần Hưng Đạo | Hoàn Kiếm | Hà Nội | ngõ 67 Trần Hưng Đạo | develop + scan | | [fb.com/nadar.photo.club02](https://facebook.com/nadar.photo.club02) | high | |
| ★ | Lab 36+ (36+ Lab & Coffee) | Lê Phụng Hiểu | Hoàn Kiếm | Hà Nội | 1B Lê Phụng Hiểu | B&W, C-41 | No | IG lab36plushn | medium | |
| ★ | Tiệm Film Hải Âu (Seagull Film Store) | Hoàng Hoa Thám | Hải Châu | Đà Nẵng | 41 Hoàng Hoa Thám | develop + scan | Yes, from other provinces | [fb.com/haiaufilm.store](https://facebook.com/haiaufilm.store) | medium | |

**Built in, always seeded:** "Tự tráng ở nhà" (home development), no branch and no city, shown in every city filter (LAB-1). Slug `home-development`.

### Found, but not proposed

| Lab | City | Why not |
|---|---|---|
| Film Drugs (Filmdrug), 299A Nguyễn Văn Trỗi, Tân Bình | TP.HCM | Low: search snippets only, mainly a camera shop |
| Noirfoto, now 131 Dương Văn An, Bình Trưng | TP.HCM | Moved; now mainly a gallery, lab status unknown |
| Darkroom Lab, 8I Trần Hữu Trang, Phú Nhuận | TP.HCM | Reported closed |
| X-Lab, 55A Hàng Than, Ba Đình | Hà Nội | Reported permanently closed |
| Croplab Cầu Giấy, 108D3 ngõ 215 Tô Hiệu | Hà Nội | Only 2017–2021 mentions; may be closed |
| Filmaniac Laboratory, 22 Hùng Vương | Đà Nẵng | Low: pages don't load, website is down |
| Lab Hoàng Gia, 45 Phan Chu Trinh | Đà Nẵng | Old forum thread only |
| LLab Huế | Huế | Outside the four cities; add if you want Huế |

### Drop-off points (collect film, a lab develops it)

Not labs, so not in the directory for now: **Trà Sữa Station** (TP.HCM and Hà Nội shops, sends to Cinephile), **Analog Cafe** (TP.HCM, sends to Cinephile), **Hoa Cải Film** (Hà Nội, sends to Cinephile), **FilmLab Hanoi** (Hà Nội, processes some days; may be a shop), **Rolling Film** and **Phở Film** (Đà Nẵng). Đà Nẵng has only one proposed lab, so most shooters there use drop-offs or mail-in.

### What the research changes

1. **District names are out of date.** Since 01.07.2025 Vietnam has no quận level and many phường merged; Đà Nẵng also merged with Quảng Nam. `lab_branch.district` should hold the **new phường**, with the old quận only as a display hint, and every branch needs its street `address`. That's one more nullable column: `lab_branch.area_hint` (e.g. "Q.1"). LAB-1's "filtered by city" still works.
2. **Seeded labs have services after all.** Most sources state them, so roadmap decision 4 ("district and city, no services") could relax to "services where a source states them". Your call (decision 4, due 01.11).
3. **Drop-off points** could be a later `kind` on `lab` (`lab` | `drop-off`, with "sends to"). Not in Phase 1.

### Sources opened

[llab.vn/all-labs](https://llab.vn/all-labs), [llab.vn/nhan-film](https://llab.vn/nhan-film), [llab.vn/dich-vu](https://llab.vn/dich-vu), [croplab.vn](https://croplab.vn/homepage), [thuongxanhfilmstore.vn](https://thuongxanhfilmstore.vn/pages/trang-scan-c-41), [noirfoto.com](https://noirfoto.com), [trasuastation.vn](https://trasuastation.vn/pages/dich-vu-trang-film-x-cinephile), [analoghouse.vn](https://analoghouse.vn/blogs/nhiep-anh-film/dia-chi-lab-trang-film-o-sai-gon-tphcm) (2023), [saigononfilm.com (Saigon)](https://saigononfilm.com/5-film-photo-labs-in-saigon-vietnam), [saigononfilm.com (Hà Nội)](https://saigononfilm.com/hanoi-film-photo-labs-list), [hoahoctro.tienphong.vn](https://hoahoctro.tienphong.vn) (12.08.2024), [hcmtoplist.com](https://hcmtoplist.com/top-5-dia-chi-trang-phim-o-sai-gon-dam-bao-chat-luong) (2023), [filmara.app](https://filmara.app/labs/in/vietnam/hanoi), [analogica.app](https://analogica.app/best-film-developing-labs-ha-noi-vietnam), findmyfilmlab.com, [colorme.vn](https://colorme.vn/blog/tong-hop-nhung-dia-chi-trang-film-uy-tin-tai-ha-noi) (2021), [matca.vn](https://matca.vn/en/vong-quanh-cac-lab-film-tai-ha-noi) (2017), [toplist.vn](https://toplist.vn/top-list/lab-film-noi-tieng-nhat-ha-noi-39676.htm), [top10danang.com](https://top10danang.com/top-5-dia-chi-trang-film-o-da-nang-uy-tin-chat-luong-nhat) (23.06.2026), and Threads posts from 2024–2026.

## Left out, on purpose

| What | Why |
|---|---|
| Lenses | Plan D3: custom lenses only in the MVP, no seeded lens catalogue |
| Canister and camera photos | Content track, due 23.11 (CAN-2). `canister_photo_key` stays empty |
| Instant film (Instax, Polaroid) | No negatives to scan. Add it if shooters ask |
| Sheet film, 110, 127, APS | Rare here. Custom entries (CAT-2) cover them |

## Decided (Trúc, 27.09.2026)

1. **Cine film:** Kodak Vision3, CineStill, and branded re-spools from small brands (Reflx Lab, Candido, Aeronega… added the same day at Trúc's request). Film a shop rolls and labels itself stays a custom entry.
2. **Single-use cameras:** seeded as cameras with a fixed film (FunSaver and four more above).
3. **"Sold in Vietnam":** not tracked. No per-shop columns.
4. **Ektar 100 canister:** `rose`, as on the `OnboardBag` board.
