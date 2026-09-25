# Labs (LAB)

> A directory of real labs and their branches, plus a way to add your own.

Back to: [Requirements index](README.md) · [PRD overview](../prd.md) · Ships in: [Phase 1](../../roadmap.md#timeline-to-soft-launch) (LAB-1, LAB-2), Phase 2 (LAB-3), v1.1b

## Requirements

| ID | P | Requirement |
|---|---|---|
| LAB-1 | P0 | Lab directory seeded with Vietnamese labs and their branches (at launch: LLAB, Croplab, Cinephile Lab and more), filtered by city and searchable without accents. "Tự tráng ở nhà" (home development) is built in. |
| LAB-2 | P0 | Add a lab that isn't listed: name, address, city, a Facebook or Maps link, services (C-41, E-6, B&W, ECN-2) and whether it takes film by post. It is usable straight away and private to the user. |
| LAB-3 | P0 | Each scan set records lab, branch and received date. Drop-off date, process, push/pull, scanner, resolution, file format and price are optional. |
| LAB-4 | P1 | Several scan sets per roll, for example a rescan at a second lab. Each keeps its own lab record. |
| LAB-5 | P1 | Private ratings of a scan set from 1 to 5 on colour, dust and scratches, sharpness, turnaround and value. Never shown publicly. |

## Flows

**My lab isn't listed:** search the lab picker; nothing matches → tap "Thêm lab mới" → fill in name, address, city and services → save. The lab is yours to use straight away.

**Scans are back from the lab:** drop the lab's folder on the roll → pick the lab and branch from the directory (LAB-3).

## Why it matters

Lab and branch on every scan set is what makes [Compare](compare.md) possible. The metric **Lab recorded** (scan sets with lab and branch) gates v1.2: Compare starts only when 200+ scan sets exist and 60%+ have lab and branch.

## Data

| Source | Shape |
|---|---|
| PRD | `Lab`: id, name, owner_id, status, website, services[], accepts_mail · `LabBranch`: id, lab_id, name, district, city, address, map_url · `ScanSet`: id, roll_id, lab_branch_id, received_at, dropped_at, process, push_pull, scanner, resolution_px, file_format, price_vnd, ratings{} |
| [ADR-001](../../architecture/adr-001-tech-stack.md#data-model-mvp) | `lab`: id, owner_id?, name · `lab_branch`: id, lab_id, district, city · `scan_set`: id, roll_id, lab_branch_id, scanned_at |

## Content work

Labs: LLAB, Croplab and Cinephile branches checked; "47+" identified; more labs in TP.HCM, Hà Nội, Đà Nẵng, Đà Lạt. Due 01.11.2026 ([content track](../../roadmap.md#content-track-runs-alongside)).

## Design

- [`LabPicker` / `LabPickerWeb`](../../design/wireframes.md#page-chia-sẻ--lab-sharing-and-labs): pick a lab, phone and desktop.
- [`LabAdd` / `LabAddWeb`](../../design/wireframes.md#page-chia-sẻ--lab-sharing-and-labs): add a new lab, phone and desktop.

## Open issues

- PRD Q3 / roadmap decision 4: launch with checked labs only, district and city, no services (decide by 01.11.2026).
- LAB-2 collects services, address and a Facebook/Maps link, but the ADR `lab` table only has `name`. Either add the columns or trim LAB-2 to match decision 4.
- LAB-3 wants optional process, push/pull, scanner, resolution, file format and price on the scan set; the ADR `scan_set` has none of them. [Compare](compare.md) needs scanner and process, so it's cheaper to store them from day one.
