# Sharing (SHARE) — core

> The growth engine: a link friends open without an account, and story cards people want to post.

Back to: [Requirements index](README.md) · [PRD overview](../prd.md) · Ships in: [Phase 4](../../roadmap.md#timeline-to-soft-launch) (SHARE-1–4), v1.1a, later

The north star is **share links opened by people who don't use Cuộn yet, per week**. Sharing is never what gets cut ([roadmap cut line](../../roadmap.md#cut-line)).

## Requirements

| ID | P | Requirement |
|---|---|---|
| SHARE-1 | P0 | Share link per roll. The token is random (at least 128 bits), the page is not indexed, GPS is removed from every file served, and the owner can revoke or replace the link at any time. |
| SHARE-2 | P0 | Friend view, on phone and desktop: the roll as a film strip or a grid (COL-5), its memory, tấm ưng, oops frames and "chụp bằng" gear from the owner's bag, ending with "Tạo kệ của bạn — miễn phí". Full-size download is off by default. |
| SHARE-3 | P0 | Link preview with the cover frame and roll title when the link is pasted into Zalo, Messenger or Facebook. |
| SHARE-4 | P0 | Story cards at 1080 × 1920, made from the roll's own data: "Dải phim" and "Phiếu cuộn" in the MVP. On phones "Đăng lên story" opens the phone's share sheet with the image; on desktop the card is downloaded and the link copied. Every card leaves room for Instagram's link sticker. |
| SHARE-5 | P1 | Two more story cards: "Ảnh dán" (collage) and "Oops của cuộn". |
| SHARE-6 | P1 | Choose what friends see (notes, memory, oops frames, full-size download), plus optional link expiry and a view count. |
| SHARE-7 | P2 | Signed-in friends can react to or comment on a frame, and several rolls can be shared as one collection. |

### Story cards

| Card | Release | Content |
|---|---|---|
| Dải phim | MVP | Two film strips with the tấm ưng marked |
| Phiếu cuộn | MVP | The roll's numbers on a ticket: days in the camera, lab, tấm ưng |
| Ảnh dán | v1.1 | Three taped prints, the canister photo and stickers |
| Oops của cuộn | v1.1 | The funniest mistake, big, on the darkroom background |

## Flow

**Share a roll to your story:** tap "Chia sẻ cuộn này" → pick a card (Dải phim or Phiếu cuộn) → tap "Đăng lên story", pick Instagram, add the link sticker → friends tap it and open the roll without signing up.

- On phones, "Đăng lên story" opens the share sheet with the card.
- On desktop the card is downloaded and the link copied; posting happens from the phone.
- Pasted into Zalo, Messenger or Facebook, the link shows the cover frame and roll title.
- Friends land on the friend view, which ends with "Tạo kệ của bạn — miễn phí". Every open by someone without an account counts toward the north star.

## Build notes

From [ADR-001 share flow](../../architecture/adr-001-tech-stack.md#share-flow):

- The link is `/r/<token>`, a random 22-character token, never the roll id, so links can be revoked.
- The page renders server-side with `og:image` pointing at a cached `next/og` PNG (1200 × 630). Story cards (1080 × 1920) come from the same renderer. Both are cached in R2 per roll version.
- Changing the roll bumps `roll.version`; the versioned `og:image` URL stops Zalo/Facebook from showing a stale preview.
- "Đăng lên story" passes the PNG to `navigator.share`; desktop falls back to download + copy link.
- North-star events go to PostHog, not the database.

Phase 0 spikes: Vietnamese diacritics in `next/og` (load Be Vietnam Pro font files), and Web Share with files on iPhone and inside the Zalo, Messenger and Instagram in-app browsers.

## Design

| Artboard | Shows |
|---|---|
| [`StoryStrip`, `StoryTicket`](../../design/wireframes.md#page-chia-sẻ--lab-sharing-and-labs) | MVP story cards |
| [`StoryCollage`, `StoryOops`](../../design/wireframes.md#page-chia-sẻ--lab-sharing-and-labs) | v1.1 story cards |
| [`ShareSheet` / `ShareDialogWeb`](../../design/wireframes.md#page-chia-sẻ--lab-sharing-and-labs) | Share a roll, phone sheet and desktop dialog |
| [`SharedRoll` / `SharedRollWeb`](../../design/wireframes.md#page-chia-sẻ--lab-sharing-and-labs) | Friend view, film strip |
| [`SharedGrid` / `SharedGridWeb`](../../design/wireframes.md#page-chia-sẻ--lab-sharing-and-labs) | Friend view, grid |

## Launch gates

- A story card posts from iPhone Safari and Android Chrome; the link preview shows in Zalo, Messenger and Facebook.
- No open bug that breaks a share link.
- Phase 4 exit (M2): a link pasted in Zalo and Messenger shows the cover, and a story posts to Instagram from iPhone and Android.

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Web Share with files fails inside in-app browsers | High | Detect it, offer "mở trong trình duyệt", fall back to download |
| Diacritics render wrong in `next/og` | Medium | Load Be Vietnam Pro font files into the renderer |
| Zalo / Facebook keep an old preview | Medium | Versioned `og:image` URL per roll version |
| Neon cold start slows the first share-page open | Medium | Cache share pages; measure in beta |

## Open issues

- **Token storage** ([Known conflicts](../../README.md#known-conflicts-between-sources) #5): the PRD stores share tokens **hashed** (`token_hash`) so a database leak doesn't expose live links; the ADR `share_link.token` is plain. Recommendation: store a SHA-256 of the token. It costs nothing and matches SHARE-1's intent.
- **Token length:** SHARE-1 asks for at least 128 bits. A 22-character base64url token is 132 bits, so it passes, but the ADR should state the alphabet.
- **GPS on downloads** (roadmap decision 3, due 01.11.2026): SHARE-1 says no served file carries GPS, but a full-size download is the original byte for byte. Suggested default: no download toggle in the MVP; serve a GPS-stripped copy once SHARE-6 ships. Also confirm the browser-made WebP derivatives drop EXIF GPS (canvas re-encoding does).
- SHARE-6 fields (`show_notes`, `show_memory`, `show_mistakes`, `expires_at`, `view_count`) are not in the ADR table; fine for the MVP (P1).
