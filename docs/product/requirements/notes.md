# Notes & mistakes (NOTE)

> The story of the roll, and the oops frames kept as content.

Back to: [Requirements index](README.md) · [PRD overview](../prd.md) · Ships in: [Phase 2](../../roadmap.md#timeline-to-soft-launch) (NOTE-1, NOTE-2), v1.1b, later

## Requirements

| ID | P | Requirement |
|---|---|---|
| NOTE-1 | P0 | Notes on a roll or a single frame (plain text, autosaved, timestamped), and one longer memory per roll: where, who, what happened. |
| NOTE-2 | P0 | Tag a frame or a whole roll with one or more mistakes plus a note. Oops frames stay in the roll with an oops stamp. |
| NOTE-3 | P1 | "Thêm ghi chú" is one tap from the roll page on a phone, and notes and memories can be searched without accents. |
| NOTE-4 | P1 | Mistake summary per camera and per lab, e.g. "light leak on 4 of 6 rolls from this camera". |
| NOTE-5 | P2 | Pin a note to a spot on a frame ("lọt sáng ở đây"). |

### Mistake types

| Vietnamese (in app) | Meaning |
|---|---|
| Lọt sáng | Light leak |
| Tấm trắng | Blank frame |
| Chồng hình | Double exposure |
| Trượt nét | Missed focus |
| Thiếu sáng | Underexposed |
| Dư sáng | Overexposed |
| Sai ISO | Wrong ISO |
| Rung tay | Camera shake |
| Mở nắp lưng | Opened the back |
| Tua phim sớm | Rewound too early |
| Lab: bụi & xước | Lab: dust & scratches |
| Lab: ám màu | Lab: colour cast |
| Khác | Other |

## Data

| Source | Shape |
|---|---|
| PRD | `Mistake / Note`: id, roll_id \| frame_id, type (mistake only), body, created_at, edited_at. `Roll.memory` |
| [ADR-001](../../architecture/adr-001-tech-stack.md#data-model-mvp) | `note` (roll_id, frame_id?, body, timestamps), `mistake` (roll_id, frame_id?, type, note?), `roll.memory`, `frame.is_keeper`, `frame.is_blank` (migration `0004`) |

## Design

- Oops frames get a `Stamp` (`tone="oops"`) and a `Scribble` (`tone="pin"`) in the [design system](../../design/design-system.md#components). Principle 3: mistakes are content, not failures.
- Handwritten notes are lowercase, 2–6 words ([voice](../../design/design-system.md#voice)).
- No notes or mistake-tagging artboard yet ([wireframes](../../design/wireframes.md#mvp-screens-with-no-artboard-yet)).

## Open issues

- ~~**PRD vs ADR on mistakes** ([Known conflicts](../../README.md#known-conflicts-between-sources) #4): NOTE-2 allows **one or more** of 13 mistake types per frame or roll, each with a note. The ADR has one `frame.mark` enum and a single `frame.note`.~~ **Resolved 30.09.2026 (Trúc):** a `mistake` table (`roll_id`, `frame_id?`, `type`, `note?`), one row per type, `frame_id` null for the whole roll. See the [Phase 2 plan](../../../.planning/plans/phase-2-scans-and-notes.md) D4.
- ~~`mark` as one enum means a frame can't be both tấm ưng and oops.~~ **Resolved 30.09.2026 (Trúc):** `frame.is_keeper` and `frame.is_blank` as the PRD models them, and a frame is oops when it has a mistake, so a tấm ưng can also be an oops (Phase 2 plan D3, D5).
- ~~NOTE-1 says notes are timestamped and autosaved; a single `note` text column holds one note per frame with no history.~~ **Resolved 30.09.2026 (Trúc):** a `note` table (`roll_id`, `frame_id?`, `body`, timestamps) replaces `frame.note` and `roll.notes`; `roll.memory` stays (Phase 2 plan D6).
