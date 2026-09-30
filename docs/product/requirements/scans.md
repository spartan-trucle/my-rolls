# Scans & storage (SCAN)

> Full-size originals, fast browsing copies.

Back to: [Requirements index](README.md) · [PRD overview](../prd.md) · Ships in: [Phase 2](../../roadmap.md#timeline-to-soft-launch) (SCAN-1–4), v1.1a, later

## Requirements

| ID | P | Requirement |
|---|---|---|
| SCAN-1 | P0 | Upload JPEG, PNG or WebP files up to 10 MB each, stored byte for byte with no resizing or recompression. Larger files and other formats are rejected before the upload starts, with the file name and its size. TIFF comes in v1.1a. |
| SCAN-2 | P0 | Bulk upload: drop a folder or select 36+ files. Frames are ordered by file name and can be reordered. One failed file never fails the batch and can be retried on its own. |
| SCAN-3 | P0 | Browsing copies (about 480 px and 2048 px) are made in the browser during upload, in sRGB. The original keeps its colour profile and loads only at 100% zoom or on download. Server-made copies come with TIFF in v1.1a. |
| SCAN-4 | P0 | Mark frames as tấm ưng (keeper) or blank. Share cards and the friend view use the tấm ưng. |
| SCAN-5 | P1 | Uploads resume after a dropped connection, and duplicate files within a roll are skipped (matched by file hash). |
| SCAN-6 | P2 | Import scans from a lab's Google Drive or WeTransfer link. |

## Non-functional

- **File size:** 10 MB per image, checked in the browser before upload and again on the server.
- **Originals:** private object storage, short-lived signed URLs only, versioned so a deleted file can be restored for 30 days.
- **Colour:** originals keep their ICC profile; browsing copies are sRGB.
- **Speed:** first row of thumbnails < 2 s on 4G; a 36-frame upload keeps going while the user moves around the app.
- **Upload failures:** < 1% after retries, excluding over-size files (a launch gate).

## Build notes

[ADR-001](../../architecture/adr-001-tech-stack.md#upload-flow) upload flow:

1. The browser resizes to 480 px and 2048 px WebP and reads EXIF.
2. The app inserts frames as `pending` and returns presigned PUT URLs. Vercel caps request bodies at 4.5 MB, so bytes never touch the app.
3. The browser PUTs the original and the two derivatives to R2, then confirms.
4. Frames still pending after 24 h are deleted by the nightly cron, along with their R2 objects.

Storage layout: originals go in a private R2 bucket; derivatives go in a public bucket behind the Cloudflare CDN, with random UUID keys.

## Data

| Source | Shape |
|---|---|
| PRD | `Frame`: id, scan_set_id, number, original_key, bytes, width, height, sha256, icc_profile, derived_keys{}, is_keeper, is_blank, alt_text |
| [ADR-001](../../architecture/adr-001-tech-stack.md#data-model-mvp) | `frame`: id, scan_set_id, user_id, position, original_key, grid_key, view_key, width, height, exif, mark, note, status |

## Design

`UploadDrop` in the [design system](../../design/design-system.md#components): top of an empty roll, or in a mobile bottom sheet. It has no progress UI yet, so SCAN-2 needs one designed. There is no upload artboard ([wireframes](../../design/wireframes.md#mvp-screens-with-no-artboard-yet)).

## Open issues

- ~~**PRD vs ADR on file types** (roadmap decision 2, due 01.11.2026): SCAN-1 accepts TIFF and SCAN-3 makes copies on the server; the ADR makes copies in the browser, which can't decode TIFF.~~ **Resolved 30.09.2026 (Trúc), roadmap decision 2:** the MVP accepts JPEG, PNG and WebP up to 10 MB, with copies made in the browser; TIFF and server-made copies move to v1.1a. SCAN-1 and SCAN-3 edited in PRD artifact version 8.
- SCAN-3 says browsing copies respect the embedded ICC profile and convert to sRGB. Browser canvas resizing handles ICC unevenly across browsers. Verify on Adobe RGB lab JPEGs in the Phase 2 spike (S1 in the [Phase 2 plan](../../.planning/plans/phase-2-scans-and-notes.md)).
- PRD Q1 / roadmap decision 6: storage cap while free. Suggested: 30 rolls (~9 GB) per account, raised on request.
- SCAN-5 (duplicate skip by hash) needs `sha256`; the ADR `frame` has no hash column. Computing it in the browser before upload is cheap.
- ~~PRD Q2: whether 10 MB is enough for TIFF (20–60 MB).~~ Decided with roadmap decision 2: TIFF and its cap are v1.1a questions.
