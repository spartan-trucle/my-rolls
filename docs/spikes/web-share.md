# Spike: Web Share to Instagram/Messenger/Zalo story

Can `navigator.share({ files })` hand the `/spike/og` story PNG (see
[og-story-image.md](og-story-image.md)) straight to a platform's story
composer? Code: `src/app/spike/share/`. Back to: [docs/README.md](../README.md).

## Why this runs on production, not a preview

`/spike/share` and `/spike/og` are public and `noindex` (D30,
`.planning/plans/phase-0-foundations.md`). The device browsers below —
especially the in-app browsers — have their own cookie jars, so they can't
pass Vercel preview protection or Google sign-in. The device pass below
happens on `my-rolls-weld.vercel.app` after this PR merges.

## How to run it

1. Open `https://my-rolls-weld.vercel.app/spike/share` on the device/browser.
2. Note the user agent shown on screen.
3. Note whether a "Chia sẻ" (share) button appears (`canShare({ files })`
   true) or the fallback download link + "mở trong trình duyệt" hint.
4. If the button appears, tap it, pick Instagram/Messenger/Zalo's story
   composer, and note whether the image actually lands there (not just
   whether the share sheet opened).
5. Screenshot the page (it shows the user agent and outcome) for the row
   below.

## Results

| Browser | `canShare({ files })` | Shared to Instagram/Messenger/Zalo story | Notes |
|---|---|---|---|
| iPhone Safari | | | |
| Android Chrome | | | |
| Zalo in-app browser | | | |
| Messenger in-app browser | | | |
| Instagram in-app browser | | | |

Result: **passed**. Trúc ran the device pass on production on 27.09.2026 and reported it as passed; per-browser screenshots weren't attached, so the rows above stay blank. Roadmap box ticked.
