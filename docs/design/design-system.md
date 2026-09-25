# Design system

> **Mirror — the artifact is the source of truth:** [Design system](https://claude.ai/artifact/HtsG9sZeNGx19PSvPjW65a) (namespace `RollCall`)
> Last synced: 25.09.2026 · artifact version `1790317950-ff46` · by Claude for Trúc · last change 25.09.2026 by Trúc: "README: added an In code section on how the Cuộn app uses the tokens and components."
> Before editing, re-read the artifact. Make changes in the artifact and copy them here in the same session (see [CLAUDE.md](../../CLAUDE.md#sync-rules)).
>
> **Naming:** the design system still calls the product **Roll Call**. The product name is **Cuộn** (see [Known conflicts](../README.md#known-conflicts-between-sources)). Token and component names stay as they are.

Related: [Wireframes](wireframes.md) · [ADR-001 (Tailwind mapped to these tokens)](../architecture/adr-001-tech-stack.md#decision) · [PRD](../product/prd.md)

The product is a home for film rolls: upload the scans, note the stock, the camera and the mistakes, and share a roll with friends. It should feel like a scrapbook someone keeps on their desk, with warm paper, tape, a red pin, indigo stickers and handwriting in the margins. The photos are always the loudest thing on the page. Everything else stays quiet except one deep, muted brand indigo.

## What lives in the artifact

| Path in artifact | What |
|---|---|
| `project/README.md` | The brand book summarised below |
| `project/tokens.json` | All tokens (tables below) |
| `project/components/bundle.js` · `bundle.css` · `index.d.ts` | React 18 components on `window.RollCall`, their stylesheet (imports the Google Fonts) and types |
| `project/components/<Name>/README.md` · `preview.html` | Guidelines and a live preview per component |
| `project/assets/{Stickers,Icons,Doodles}/` | SVG assets (uploads in the artifact's asset store) |

To pull a file into the repo: `Artifact read` with the artifact URL and a `path` from the table.

## Principles

1. **Photos first, one brand indigo.** The UI is paper and ink, with a single brand colour: `cobalt`, a deep muted indigo (not a bright electric blue). It is for primary actions, links, focus and stickers. `pin` is only for oops and errors. Everything else takes its colour from the scans. The `stock-*` colours only ever appear on film canisters.
2. **80% clean, 20% scrapbook.** Lay pages out on a calm, straight grid. Then add at most **three scrapbook moments per screen**: a tilted print, a strip of tape, a pin, a scribbled note, a doodle, a sticker. Landing and marketing pages may go up to five, with stickers clustered around the photos.
3. **Mistakes are content.** Oops frames (light leaks, blinks, wrong ISO) are features, not failures. Give them an oops stamp and a red handwritten note instead of hiding them.
4. **Vintage, but not old.** Warm paper, typewriter-style metadata and real film details (edge numbers, sprocket holes). No sepia filters, no fake scratches, no distressed fonts.

## Voice

- First person, casual, like a note on the back of a print: "blinked. again.", "pine hill, 5:40am", "opened the back, oops".
- Handwritten notes (`note`, `note-sm`) are lowercase and short, 2–6 words. Film data stays in mono: `ISO 400 · 36 EXP · f/8`.
- UI copy is sentence case with the verb first: "Upload a roll", "Share this roll", "Add a note". Labels use the uppercase `label` style.
- Humour and self-teasing are fine ("That's a lot. Pushed +3?"). Never tease the photo or the friend in it.
- No emoji in the UI. One kaomoji in a handwritten note (`≧ω≦`) per page is allowed.
- Say "roll", "frame", "stock", "scan", "keeper", "oops". Don't say "album", "asset" or "upload item". In the Vietnamese UI, use the [PRD glossary](../product/prd.md#words-we-use).

## Colour

Two themes: **Paper** (light, default) and **Darkroom** (dark, with a soft dusty periwinkle `cobalt`, safelight-red `pin` and sprocket holes that glow like a lightbox).

| Token | Paper | Darkroom | Usage |
|---|---|---|---|
| `paper` | `#f2ede4` | `#161311` | Page background; carries the grain overlay (`.rc-paper`) |
| `paper-raised` | `#faf7f1` | `#201b18` | Inputs, upload drop zone, surfaces one layer above paper |
| `scrap` | `#f7f0e1` | `#352d26` | Aged-paper scrap behind roll cards |
| `scrap-edge` | `#dccdb0` | `#4d4137` | Fibre line along a scrap's torn edge (decorative) |
| `scrap-rule` | `rgba(120,98,70,.12)` | `rgba(239,231,219,.06)` | Faint ruled lines on a scrap (decorative) |
| `line` | `#ddd4c6` | `#3a322c` | Hairlines and dividers; never a control's only edge |
| `line-strong` | `#8c7f70` | `#7d7063` | Input borders, dashed upload outline (3:1) |
| `ink` | `#1f1a16` | `#efe7db` | Primary text, headings, outline-button borders, doodles |
| `ink-muted` | `#675d52` | `#a99c8d` | Secondary text: camera, dates, hints, labels |
| `cobalt` | `#2e3a80` | `#9aa3d4` | **Brand.** Primary buttons, links, active tab, focus, stickers, footer band. At most one filled cobalt control per screen |
| `cobalt-deep` | `#222c63` | `#b4bbe2` | Hover/pressed cobalt fills; details inside stickers |
| `cobalt-soft` | `#dfe1ec` | `#1e2442` | Tinted ground behind cobalt text; upload zone on drag-over |
| `on-cobalt` | `#fffaf3` | `#10142b` | Text and icons on solid cobalt (7:1+) |
| `print` | `#fffdf8` | `#ebe4d8` | Print borders, canister label band; stays light in Darkroom |
| `on-print` | `#1f1a16` | `#1f1a16` | Captions and notes on a print border or canister label |
| `on-print-muted` | `#675d52` | `#675d52` | Dates and small metadata on a print border |
| `on-print-pin` | `#b3261e` | `#b3261e` | Oops note in red pen on a print border |
| `pin` | `#b3261e` | `#ff6a55` | Oops colour: pins, oops stamps and notes, error text. Never buttons or links |
| `pin-soft` | `#f5ddd6` | `#3e1712` | Tinted ground behind pin text |
| `on-pin` | `#fffaf3` | `#1a0d0a` | Text on a solid pin fill |
| `focus` | `{cobalt}` | `{cobalt}` | Focus ring: 2px solid, 3px offset |
| `keeper` | `#2e6e48` | `#6fbf8e` | Keeper status; always paired with the word or sparkle icon |
| `on-keeper` | `#fffaf3` | `#0f1a13` | Text on a solid keeper fill |
| `film` | `#1e1916` | `#3a2f28` | Film-strip base |
| `film-hole` | `#f2ede4` | `#ebe4d8` | Sprocket holes |
| `film-edge` | `#e8a13a` | `#f0b04c` | Edge-print text on the film rail; only on film |
| `tape` | `rgba(226,211,170,.78)` | `rgba(214,196,150,.6)` | Masking tape on a featured print |
| `stock-gold` | `#e2ae1c` | `#f0c14a` | Canister: warm colour negative |
| `stock-green` | `#2e7a50` | `#6fbf8e` | Canister: cool colour negative |
| `stock-blue` | `#3b5f8c` | `#8fb0dc` | Canister: slide / reversal |
| `stock-mono` | `#4a4541` | `#b8b0a6` | Canister: black and white |
| `stock-rose` | `#a63e62` | `#e892ad` | Canister: cine, redscale, expired mystery rolls |

Rules:

- Status always has a shape as well as a colour: the `keeper` sparkle icon, the `oops` "!!!" icon (with an accessible label), or the word itself. Never colour alone.
- `stock-*` are generic colour families. Never draw a manufacturer's logo, box art or trade dress. Put the stock name as text next to the canister.

## Type

All four families come from Google Fonts and include Vietnamese diacritics (Đà Lạt, Hội An).

| Family token | Stack | For |
|---|---|---|
| `display` | Fraunces, Georgia, serif | Headers |
| `sans` | Be Vietnam Pro, system-ui, sans-serif | All UI and running text |
| `mono` | Space Mono, ui-monospace, monospace | Every piece of film or camera data |
| `hand` | Patrick Hand, cursive | Human notes only; never buttons, nav, labels or long text |

| Style | Family | Size / line | Weight | Tracking | Usage |
|---|---|---|---|---|---|
| `display-hero` | display | 88 / 84 | 500 | -0.025em | Landing hero only; becomes `display-xl` under 600px |
| `display-xl` | display | 56 / 56 | 500 | -0.02em | One per page: roll title on desktop; becomes `display-l` under 600px |
| `display-l` | display | 40 / 44 | 500 | -0.015em | Page titles on mobile; section titles on desktop |
| `title` | display | 22 / 28 | 600 | — | Roll-card names, dialog titles |
| `body` | sans | 16 / 24 | 400 | — | Running text and inputs (16px stops iOS zoom) |
| `body-sm` | sans | 14 / 20 | 400 | — | Secondary UI copy, list rows |
| `label` | sans | 12 / 16 | 600 | 0.08em | Field labels, nav, tabs; always uppercase |
| `meta` | mono | 13 / 18 | 400 | — | Stock, ISO, exposures, dates, camera, lens |
| `edge` | mono | 11 / 14 | 700 | 0.12em | Edge print on film rails and stamps, uppercase |
| `note` | hand | 24 / 28 | 400 | — | Captions, oops notes, one scribble per section |
| `note-sm` | hand | 19 / 22 | 400 | — | Captions on small prints and film frames |

Use one `display-*` per screen.

## Space, shape, depth

| Spacing | Value | Usage |
|---|---|---|
| `space-1` | 4px | Icon-to-text gaps, stamp padding |
| `space-2` | 8px | Label to input, caption to print |
| `space-3` | 12px | Classic print border, input side padding |
| `space-4` | 16px | Mobile gutter, card padding, mobile grid gap |
| `space-6` | 24px | Desktop grid gap; mobile section padding |
| `space-8` | 32px | Between blocks inside a section |
| `space-12` | 48px | Instant-print bottom border; between sections on mobile |
| `space-16` | 64px | Between sections on desktop |

| Radius | Value | Usage |
|---|---|---|
| `radius-none` | 0 | Prints, photos and buttons |
| `radius-sm` | 2px | Film frames, stamps, canister bodies |
| `radius-md` | 8px | Inputs |
| `radius-lg` | 14px | Upload drop zone, mobile sheets |
| `radius-pill` | 999px | Push-pins and avatar dots only |

| Shadow | Usage |
|---|---|
| `shadow-print` | Every print lying on paper; the only resting shadow |
| `shadow-lift` | A print on hover or while dragged |
| `shadow-pin` | The push-pin head |

| Tilt | Value | Usage |
|---|---|---|
| `tilt-none` | 0deg | Prints in grids and on mobile |
| `tilt-left` | -2deg | Featured print, tape strips |
| `tilt-right` | 1.5deg | Second print in a collage |
| `tilt-wild` | -4deg | At most one per page: hero print or a sticker |

`grain-opacity` is 0.07: paper grain over the page background, never over photos.

- Only prints, tape and the doodle button tilt. Grids and lists are always `tilt-none`, and so is everything on a screen under 600px except the one hero print.
- Only prints cast a shadow. Scraps are flat, with no shadow and no border.

## Imagery

- Show scans uncropped at their own ratio (3:2, 2:3, 6×6, 6×7). Never add fake film borders or filters to someone's photo.
- Sequence views use `FilmStrip`. Featured and collage views use `Print`. Library views use a straight grid of `Print` or a list of `RollCard`.
- Alt text describes the photo ("Pine hill at sunrise"). A blank frame is "Frame 14, blank".

## Mobile

- Mobile first at 390px, single column, `space-4` gutters. The film strip goes edge to edge and scrolls sideways with snap. Prints go in a 2-column grid.
- Touch targets are at least 44px. Primary actions sit at the bottom of the page, full width.
- Reference layout: the **Roll page (mobile)** preview (`project/components/RollPage/preview.html`).

## Motion

Small and physical, 150–200ms ease. On hover a print straightens to `tilt-none`, lifts 2px and switches to `shadow-lift`; buttons rise 1px; the doodle button wobbles to `tilt-left`. Respect `prefers-reduced-motion`. No page transitions, no bouncing.

## States

- Focus: 2px solid `focus` ring, 3px offset, on every interactive element.
- Disabled: 45% opacity, no hover.
- Errors: written in `pin`, in a human voice, under the field ("That's a lot. Pushed +3?"). No error icons.
- Drag-over on the upload zone: `cobalt-soft` fill with a `cobalt` dashed border. **Conflict:** the UploadDrop guideline says `pin-soft` + `pin`; see [Known conflicts](../README.md#known-conflicts-between-sources).

## Components

All are on `window.RollCall` (React 18). Props listed are what the consumer provides.

| Component | What it is | Props | Key rules |
|---|---|---|---|
| `Button` | Square-cornered button, 4 variants | `children`, `onClick`, `variant` (`primary` · `outline` default · `quiet` · `doodle`), `size="sm"`, `icon`, `disabled` | `primary` at most once per screen. Icon-only needs `aria-label`. 44px tall (36px `sm`). Never tilt (except doodle on hover), never `pin` fill, never hand font |
| `Field` | Labelled text input | `label`, `hint`, `error`, `mono`, input attributes | 16px text, 44px tall, `line-strong` border. Use `mono` for ISO/stock data |
| `FilmStrip` | Roll as a strip of negatives with sprocket rails and edge print; horizontal scroll with snap | `frames` (`{src, alt, number, flag, onClick}`; `flag` = `keeper` \| `oops`; no `src` = blank), `frameWidth` (default 200), `edgeText`, `label` | Edge to edge on mobile. 150px frames on phones, 180–220px desktop. Flag only a few frames |
| `Print` | Photo as a physical print | `src`, `alt`, `caption`, `date`, `width` (240), `aspect` (`3/2` · `2/3` · `4/5` · `1/1`), `format` (`classic` · `instant` · `borderless`), `attach` (`tape` · `tape-corner` · `pin`), `tilt`, `oops` | Tape for hero prints, pin for oops boards. Grids: `tilt="none"`, width 100%. Max 3 tilted prints per screen. Dates `dd.mm.yy` |
| `RollCard` | One roll in a list, on a torn scrap with a generic canister | `name`, `stock` (`gold` · `green` · `blue` · `mono` · `rose`), `iso`, `film`, `exposures`, `camera`, `date`, `oops`, `keepers`, `href` | Pick `stock` by film family, not brand. No logos. Flat: no tilt, tape or shadow |
| `Stamp` | Rubber-stamped mono label | `children`, `tone` (`neutral` · `ink` · `keeper` · `oops`), `icon`, `label`, `solid`, `tilt` | `label` required for icon+number stamps. `solid` only on photos. `tilt` once per screen |
| `Scribble` | Handwritten margin note with optional doodled arrow | `children`, `arrow` (`none` · `left` · `right` · `down`), `tone` (`ink` · `pin`), `size="sm"` | `pin` tone for oops. One per section. Never for required instructions |
| `Icon` | Functional line icons | `name`, `size` (20), `label` | 20px in buttons/nav, 14px in stamps, 24px standalone. `currentColor`: `ink` by default, `ink-muted` for inactive nav, `cobalt` for the active tab, `pin` for oops, `keeper` for keepers |
| `UploadDrop` | Drop zone for scans | `onFiles(files)`, `title`, `hint`, `accept` (`image/*`) | Top of an empty roll, or in a mobile bottom sheet. No progress UI yet |

Also in the artifact: `Cover` (the system's cover page) and `RollPage` (the mobile roll page reference layout), preview only.

## Iconography

| Set | Where | Style | Use |
|---|---|---|---|
| **Stickers** (9): bang, sparkle, bolt, reel, camera, canister, butterfly, smile, heart | `assets/Stickers/`, class `.rc-sticker` + `--rc-tilt` | Die-cut `cobalt` shapes, thick white border, soft shadow, halftone patch; 120×120, same in both themes | Loud decoration around photos and headings at 56–120px, tilted up to ±15°. 1–2 per product screen, up to 5 on landing. `alt=""`. Never over faces or text |
| **Doodles** (7): arrow-curl, burst, sparkle, squiggle, smile, circle-scribble, bang | `assets/Doodles/` | Hand-drawn, single ink, 2.5px stroke in `ink`; invert on Darkroom | Quiet decoration beside notes and captions, 1–2 per screen at 32–64px. Never functional |
| **Icons** (11): roll, film, camera, print, keeper, oops, friends, share, upload, note, menu | `assets/Icons/` and the `Icon` component | 24px grid, 1.75 stroke, round caps, `currentColor` | Functional. For counts use icon + number (`[sparkle] 5`). Every icon-only element gets an accessible label |

There is no logo. Set the name in Fraunces at weight 600.

## In code

How the app uses the design system ([ADR-001](../architecture/adr-001-tech-stack.md#decision): Tailwind mapped to the tokens):

- `tokens.json` is copied byte for byte into [`design-tokens/tokens.json`](../../design-tokens/README.md). `pnpm tokens` generates `src/styles/tokens.css` from it: CSS variables for each theme (Paper on `:root`, Darkroom under `prefers-color-scheme: dark` or `data-theme="dark"`) plus Tailwind v4 `@theme` blocks, so utilities like `bg-cobalt`, `text-title`, `font-mono` and `rounded-sm` use the token names directly. Tailwind's own colours, fonts, text sizes, radii and shadows are switched off.
- Token names stay exactly as they are here (`cobalt`, `ink-muted`, `space-4`), so these docs, the previews and the code use the same words.
- The components are ported to typed React components with CSS Modules in `src/design-system/`. They contain no UI text: every label and accessible name is passed in as a prop, because the app's UI is in Vietnamese.
- The four fonts load through `next/font` with the Vietnamese subset instead of the Google Fonts `@import` in `components/bundle.css`.
- After changing `tokens.json` in the artifact, copy it into the app again and run `pnpm tokens`. One test fails if the generated CSS is out of date, and another checks the colour contrast pairs in both themes.
