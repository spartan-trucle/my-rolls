# Spike: story PNG with next/og

Can `next/og`'s `ImageResponse` render a 1080×1920 story PNG with Be Vietnam
Pro and Vietnamese diacritics, with the font fetched from Google Fonts at
render time instead of shipped as a file (D31,
`.planning/plans/phase-0-foundations.md`)? Code:
`src/app/spike/og/route.tsx`, `src/lib/google-font.ts`. Back to:
[docs/README.md](../README.md).

## What it does

`GET /spike/og` fetches Be Vietnam Pro 400/700 from the Google Fonts CSS2
API (`text=` subsetted to the exact glyphs on the card, no browser User-Agent
so Google answers with TTF, not woff2 — Satori can't read woff2), then
renders a 1080×1920 PNG with a sample photo, "tấm ưng", "Cuộn phim đầu
tiên", and every Vietnamese tone mark on a/e/o/u/y. Public and `noindex`
(D30). `Cache-Control: public, max-age=31536000, immutable` on success;
`503` if Google Fonts is unreachable or unparseable — no fallback font.

## Found during this spike

- **WebP images aren't decodable.** The `next/og`/Satori/resvg build bundled
  with Next 16.3.6 throws (`TypeError: u2 is not iterable`) on a WebP
  `<img src>`, confirmed with a standalone Node repro outside the app too.
  PNG and JPEG decode fine. The route uses a JPEG copy
  (`public/samples/lanterns-at-night-og.jpg`) of the WebP sample photo
  instead. Revisit if a later Next/`@vercel/og` version fixes WebP decoding
  — the extra JPEG copy could then go away.
- `ImageResponse` needs a real, parseable TTF and throws
  (`Unsupported OpenType signature`) on anything else — no silent fallback,
  matching D31's "no fallback font" call.

## How to check it

1. Open `https://<preview-url>/spike/og` (or production after merge).
2. Eyeball every diacritic on the tone-mark line — this is what the spike
   is actually testing; automated tests only check the PNG's dimensions
   and headers (see `route.test.ts`), not per-glyph rendering.

## Results

| Check | Result | Notes |
|---|---|---|
| Diacritics render correctly (by eye) | | |
| Font fetch time from `sin1` (cold) | | Vercel function logs / `Server-Timing`, or time the request by hand |
| Font fetch time from `sin1` (warm, same text) | | Module-scope memoisation (D31) should make this ~0 |
| Google Fonts unreachable behaviour | 503, confirmed in `route.test.ts` | No fallback font, by design (D31) |

_Filled in by Trúc after this PR merges._
