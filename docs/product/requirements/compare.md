# Compare (CMP)

> The original pain point. Its data is collected from day one; the views ship once there is enough of it.

Back to: [Requirements index](README.md) · [PRD overview](../prd.md) · Ships in: [v1.2](../../roadmap.md#after-launch) (May – Jun 2027), later

Why do two rolls look different? Compare puts frames next to the settings that made them. It only pays off once someone has the same stock back from two labs, so the lab and branch are recorded from day one ([LAB-3](labs.md)).

**Start condition:** v1.2 starts only when 200+ scan sets exist and 60%+ of them have lab and branch.

## Requirements

| ID | P | Requirement |
|---|---|---|
| CMP-1 | P1 | Filter the library by stock, camera, lab, branch, process, push/pull, date and mistake. Filters combine. |
| CMP-2 | P1 | Compare 2 to 4 rolls or scan sets side by side: a row of frames for each and a settings table where values that differ are highlighted. |
| CMP-3 | P1 | Compare two frames side by side or with a split slider. Zoom and pan stay in sync up to 100% of the original. |
| CMP-4 | P2 | Colour profile per frame, computed at upload: warm/cool shift, green/magenta shift, saturation, brightness histogram and a 5-colour palette, averaged per roll. |
| CMP-5 | P2 | Lab, stock and camera views: for one stock, every lab and branch used, with average colour profile, the user's ratings, turnaround and price. |
| CMP-6 | P2 | Rescan pairing, and saving a comparison as a link. |

## Example (from the PRD)

Same negatives, two labs. The highlighted rows differ.

| Setting | Lab A | Lab B |
|---|---|---|
| Stock | Gold 200 · 35mm | Gold 200 · 35mm |
| Shot at | ISO 200 · box speed | ISO 200 · box speed |
| Process | C-41 | C-41 |
| **Scanner** | Noritsu HS-1800 | Frontier SP-3000 |
| **Resolution** | 3024 × 2016 | 4492 × 3000 |
| **Delivered as** | JPEG · sRGB | JPEG · Adobe RGB |
| **Warm / cool** | +6 warm | −3 cool |
| **Green / magenta** | 0 | +5 green |
| **Turnaround** | 2 days | 5 days |

Same stock and process, but a different scanner and colour space: that explains the green shift.

> **Keep in mind:** a scan is the lab's reading of the negative. Developer, scanner and operator all shape the colour, so colour profiles describe the scan, not the film alone. The UI says this next to every colour number, and records scanner and colour space so differences can be explained.

## What the MVP must record so Compare works later

- Lab and branch on every scan set (LAB-3, P0).
- Scanner, process, push/pull, resolution and file format on the scan set (optional in LAB-3). **Not in the ADR `scan_set` table yet**; see [labs open issues](labs.md#open-issues).
- The ICC profile or colour space of the original (SCAN-3). Compare explains the green shift above by "delivered as Adobe RGB".
- Mistake types (NOTE-2), used for the CMP-1 filter.

## Design

No Compare artboards yet. The PRD artifact has an interactive split-slider demo with a 5-colour palette and a settings diff table, which is the starting reference for CMP-2 and CMP-3.
