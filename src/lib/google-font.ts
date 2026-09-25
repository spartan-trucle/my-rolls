const FONT_FAMILY = "Be Vietnam Pro";
const WEIGHTS = [400, 700] as const;

export type TFontWeight = (typeof WEIGHTS)[number];

export interface IGoogleFontFile {
  weight: TFontWeight;
  data: ArrayBuffer;
}

/**
 * Google Fonts is unreachable, or its CSS2 response can't be parsed. Typed
 * so `spike/og/route.tsx` can catch it specifically and answer 503 instead
 * of letting `ImageResponse` fail on undefined font data (D31: no fallback
 * font).
 */
export class GoogleFontError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "GoogleFontError";
  }
}

/**
 * Pulls every `src: url(...)` (one per weight) out of a Google Fonts CSS2
 * response, paired with the `font-weight` from the same `@font-face`
 * block. Regex, not a CSS parser: the CSS2 API's output is small and
 * predictable enough that a full parser would be overkill.
 */
function parseFontUrlsByWeight(css: string): Map<number, string> {
  const urlsByWeight = new Map<number, string>();
  const blocks = css.split("@font-face").slice(1);

  for (const block of blocks) {
    const weightMatch = /font-weight:\s*(\d+)/.exec(block);
    const urlMatch = /src:\s*url\(([^)]+)\)/.exec(block);
    if (!weightMatch || !urlMatch) continue;
    urlsByWeight.set(Number(weightMatch[1]), urlMatch[1]);
  }

  if (urlsByWeight.size === 0) {
    throw new GoogleFontError("Could not parse any @font-face src url out of the Google Fonts CSS2 response");
  }

  return urlsByWeight;
}

async function fetchCss(text: string): Promise<string> {
  const url = new URL("https://fonts.googleapis.com/css2");
  url.searchParams.set("family", `${FONT_FAMILY}:wght@${WEIGHTS.join(";")}`);
  url.searchParams.set("text", text);

  let response: Response;
  try {
    // No browser User-Agent: Google only answers with legacy (non-woff2)
    // TTF `src` urls for user agents it doesn't recognise as a modern
    // browser (D31) — `ImageResponse`'s Satori can't read woff2.
    response = await fetch(url);
  } catch (cause) {
    throw new GoogleFontError("Google Fonts CSS2 API is unreachable", { cause });
  }

  if (!response.ok) {
    throw new GoogleFontError(`Google Fonts CSS2 API responded with ${response.status}`);
  }

  return response.text();
}

async function fetchFontBytes(url: string, weight: TFontWeight): Promise<ArrayBuffer> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (cause) {
    throw new GoogleFontError(`Could not fetch the weight ${weight} font file`, { cause });
  }

  if (!response.ok) {
    throw new GoogleFontError(`Font file for weight ${weight} responded with ${response.status}`);
  }

  return response.arrayBuffer();
}

const cache = new Map<string, Promise<IGoogleFontFile[]>>();

/**
 * Fetches Be Vietnam Pro 400 and 700 from Google Fonts, subset to the exact
 * `text` on the card (D31), and returns their raw TTF bytes for
 * `ImageResponse`'s `fonts` option. Memoised per `text` at module scope, so
 * repeat renders of the same card don't refetch. Throws `GoogleFontError`
 * — never a fallback font — when Google is unreachable or the response
 * can't be parsed; `spike/og/route.tsx` turns that into a 503.
 */
export function loadGoogleFontFiles(text: string): Promise<IGoogleFontFile[]> {
  const cached = cache.get(text);
  if (cached) return cached;

  const promise = (async () => {
    const css = await fetchCss(text);
    const urlsByWeight = parseFontUrlsByWeight(css);

    const files: IGoogleFontFile[] = [];
    for (const weight of WEIGHTS) {
      const url = urlsByWeight.get(weight);
      if (!url) throw new GoogleFontError(`No src url found for weight ${weight}`);
      files.push({ weight, data: await fetchFontBytes(url, weight) });
    }

    return files;
  })();

  cache.set(text, promise);
  // Don't cache a rejected fetch: a transient Google outage shouldn't
  // permanently 503 the route for the rest of the process's lifetime.
  promise.catch(() => cache.delete(text));

  return promise;
}
