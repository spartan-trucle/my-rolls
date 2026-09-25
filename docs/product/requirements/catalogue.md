# Catalogue (CAT)

> Every stock and camera that exists, seeded by the team before launch.

Back to: [Requirements index](README.md) · [PRD overview](../prd.md) · Ships in: [Phase 1](../../roadmap.md#timeline-to-soft-launch) (CAT-1, CAT-2), v1.1b, later

## Requirements

| ID | P | Requirement |
|---|---|---|
| CAT-1 | P0 | Seeded catalogue of the film stocks sold in Vietnam and the cameras common here (brand, name, ISO, type, format), with the team's recaptured canister and camera photos. Search ignores accents. |
| CAT-2 | P0 | Custom stock or camera: goes straight into the user's bag and is private to them. Covers reloaded cine film, expired rolls and shop-rolled film that the catalogue doesn't have. |
| CAT-3 | P1 | Submit a custom stock, camera, lab or a canister or camera photo to the shared catalogue. One review queue for all of them: approve, reject with a reason, or merge a duplicate. |
| CAT-4 | P1 | Approved entries and photos credit the contributor. Anyone signed in can report a wrong or duplicate entry. |
| CAT-5 | P2 | Camera pages show mistake tags pooled across users who opt in, e.g. "light leak reported on 3 of 10 rolls". |

Community photo flow (v1.1): **Recapture** (photograph the canister or camera on a plain background) → **Submit** (upload up to 10 MB, pick the stock or camera) → **Review** (approve, reject with a reason, or merge) → **In the catalogue** (anyone logging that stock can use the photo).

## Data

| Source | Shape |
|---|---|
| PRD | `Stock`: id, brand, name, iso, type, format[], owner_id (null = catalogue), status (private \| pending \| approved), canister_photo_id · `CameraModel`: id, brand, model, type, format, owner_id, status, photo_id · `CatalogPhoto`: id, kind, stock_id \| camera_model_id, uploader_id, original_key, status, reviewed_by, reviewed_at |
| [ADR-001](../../architecture/adr-001-tech-stack.md#data-model-mvp) | `stock`: id, owner_id?, brand, name, iso, format, type, canister_photo_key · `camera`: id, owner_id?, brand, model, format |

`owner_id` null means seeded catalogue; set means private custom entry. The PRD's single `status` field lets one review queue cover stocks, cameras and labs (CAT-3). The ADR defers that to a `submission` table in v1.1 ([revisit triggers](../../architecture/adr-001-tech-stack.md#revisit-triggers)).

## Content work

From the [roadmap content track](../../roadmap.md#content-track-runs-alongside):

- Catalogue: every stock sold at 3–4 big Vietnamese film shops, plus the common cameras here. Due 01.11.2026 (blocks the Phase 1 exit).
- Recaptured canister and camera photos matched to catalogue entries. Due 23.11.2026 (blocks CAN-2).

## Build notes

- Accent-free search: normalise Vietnamese diacritics at write time into a search column (or use Postgres `unaccent`), so "da lat" matches "Đà Lạt". This is needed for CAT-1, LAB-1 and NOTE-3.

## Open issues

- PRD Q5: canister photos show real brand logos. The suggested default is to keep them as reference photos and leave drawn canisters unbranded (decide by 23.11.2026).
- PRD `format[]` is an array (one stock in 35mm and 120); the ADR `format` is a single value.
