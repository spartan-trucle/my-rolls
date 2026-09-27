import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

import messages from "../../../../messages/vi.json";
import { GoogleFontError, loadGoogleFontFiles } from "@/lib/google-font";

/**
 * Spike 1 (D30, D31): can `next/og` render a 1080×1920 story PNG with Be
 * Vietnam Pro and Vietnamese diacritics? Node runtime — Satori's font
 * loader needs `fetch`-able TTF bytes and local filesystem access for the
 * sample photo, both simplest under Node. Public and `noindex`
 * (`proxy-decision.ts` + the header below): device testing for Spike 2
 * happens on production, where Vercel preview protection would otherwise
 * block it.
 */
export const runtime = "nodejs";

const WIDTH = 1080;
const HEIGHT = 1920;

const COPY = messages.spike.og;

// Every glyph shown on the card, so the Google Fonts `text=` param (D31)
// subsets to exactly what's needed — no more, no less.
const CARD_TEXT = `${COPY.title} ${COPY.keeperLabel} ${COPY.toneMarks}`;

// Read once at module scope (next/og's own guidance for local assets/fonts):
// a fixed sample photo, not request data, so there's nothing to re-read per
// request. Vercel's build tracing includes files reached via a statically
// joined `process.cwd()` path like this one.
//
// A JPEG copy, not the WebP original (`lanterns-at-night.webp`, D20): the
// resvg build inside this Next version's bundled `next/og` throws
// (`TypeError: u2 is not iterable`) decoding a WebP `<img src>`, confirmed
// with a standalone repro outside Vitest too, while the same bytes as PNG
// or JPEG render fine. Recorded in `docs/spikes/og-story-image.md`.
const photoDataUriPromise = readFile(
  path.join(process.cwd(), "public/samples/lanterns-at-night-og.jpg"),
).then((buffer) => `data:image/jpeg;base64,${buffer.toString("base64")}`);

export async function GET() {
  try {
    const [fontFiles, photoSrc] = await Promise.all([loadGoogleFontFiles(CARD_TEXT), photoDataUriPromise]);

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#F6F1E7",
            padding: 64,
            fontFamily: "Be Vietnam Pro",
          }}
        >
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: "#2B2622" }}>{COPY.title}</div>
          <div
            style={{
              display: "flex",
              flex: 1,
              marginTop: 40,
              borderRadius: 24,
              overflow: "hidden",
            }}
          >
            {
              // eslint-disable-next-line @next/next/no-img-element -- ImageResponse (Satori) needs a plain <img>, not next/image.
              <img
                src={photoSrc}
                width={952}
                height={1428}
                // Decorative: this PNG is the alt text itself (a shared image), not a
                // page with its own accessibility tree — Satori doesn't read `alt` either.
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            }
          </div>
          <div style={{ display: "flex", marginTop: 32, fontSize: 48, fontWeight: 700, color: "#B23A2E" }}>
            {COPY.keeperLabel}
          </div>
          <div style={{ display: "flex", marginTop: 16, fontSize: 22, color: "#6B6259" }}>{COPY.toneMarks}</div>
        </div>
      ),
      {
        width: WIDTH,
        height: HEIGHT,
        fonts: fontFiles.map((file) => ({
          name: "Be Vietnam Pro",
          data: file.data,
          weight: file.weight,
          style: "normal" as const,
        })),
        headers: {
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Robots-Tag": "noindex",
        },
      },
    );
  } catch (error) {
    if (error instanceof GoogleFontError) {
      return new Response("Google Fonts is unreachable", {
        status: 503,
        headers: { "X-Robots-Tag": "noindex" },
      });
    }
    throw error;
  }
}
