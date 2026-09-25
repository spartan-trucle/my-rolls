import { afterEach, describe, expect, it, vi } from "vitest";
import { GoogleFontError, loadGoogleFontFiles } from "./google-font";

const SAMPLE_CSS = `
/* vietnamese */
@font-face {
  font-family: 'Be Vietnam Pro';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/bevietnampro/v11/QdVPSTAyLFyeg_IDWvOJmVES_HRUBQ.ttf) format('truetype');
}
/* vietnamese */
@font-face {
  font-family: 'Be Vietnam Pro';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/bevietnampro/v11/QdVISTAyLFyeg_IDWvOJmVES_MYZGz1w.ttf) format('truetype');
}
`;

const FONT_BYTES = new Uint8Array([1, 2, 3, 4]).buffer;

function mockFetchSequence(
  responses: Array<{ ok: boolean; text?: () => Promise<string>; arrayBuffer?: () => Promise<ArrayBuffer> }>,
) {
  const fetchMock = vi.fn();
  for (const response of responses) fetchMock.mockResolvedValueOnce(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("loadGoogleFontFiles", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches the CSS2 API with no browser user agent and text=, then the two TTF files", async () => {
    const fetchMock = mockFetchSequence([
      { ok: true, text: () => Promise.resolve(SAMPLE_CSS) },
      { ok: true, arrayBuffer: () => Promise.resolve(FONT_BYTES) },
      { ok: true, arrayBuffer: () => Promise.resolve(FONT_BYTES) },
    ]);

    const files = await loadGoogleFontFiles("tấm ưng");

    const [cssCall] = fetchMock.mock.calls;
    const cssUrl = new URL(cssCall[0] as string);
    expect(cssUrl.origin + cssUrl.pathname).toBe("https://fonts.googleapis.com/css2");
    expect(cssUrl.searchParams.get("family")).toBe("Be Vietnam Pro:wght@400;700");
    expect(cssUrl.searchParams.get("text")).toBe("tấm ưng");
    const [, cssRequestInit] = cssCall as [string, RequestInit | undefined];
    expect((cssRequestInit?.headers as Record<string, string> | undefined)?.["User-Agent"]).toBeUndefined();

    expect(files).toEqual([
      { weight: 400, data: FONT_BYTES },
      { weight: 700, data: FONT_BYTES },
    ]);
  });

  it("memoises per text at module scope — a second call with the same text doesn't refetch", async () => {
    const fetchMock = mockFetchSequence([
      { ok: true, text: () => Promise.resolve(SAMPLE_CSS) },
      { ok: true, arrayBuffer: () => Promise.resolve(FONT_BYTES) },
      { ok: true, arrayBuffer: () => Promise.resolve(FONT_BYTES) },
    ]);

    await loadGoogleFontFiles("cùng một chữ");
    await loadGoogleFontFiles("cùng một chữ");

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("throws GoogleFontError when the CSS2 API is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    await expect(loadGoogleFontFiles("khong ket noi duoc")).rejects.toBeInstanceOf(GoogleFontError);
  });

  it("throws GoogleFontError when the CSS2 API responds with a non-OK status", async () => {
    mockFetchSequence([{ ok: false, text: () => Promise.resolve("") }]);

    await expect(loadGoogleFontFiles("loi status")).rejects.toBeInstanceOf(GoogleFontError);
  });

  it("throws GoogleFontError when the CSS response has no parseable src url", async () => {
    mockFetchSequence([{ ok: true, text: () => Promise.resolve("not css at all") }]);

    await expect(loadGoogleFontFiles("khong parse duoc")).rejects.toBeInstanceOf(GoogleFontError);
  });

  it("throws GoogleFontError when a font file fetch fails", async () => {
    mockFetchSequence([
      { ok: true, text: () => Promise.resolve(SAMPLE_CSS) },
      { ok: false, arrayBuffer: () => Promise.resolve(FONT_BYTES) },
    ]);

    await expect(loadGoogleFontFiles("loi tai file font")).rejects.toBeInstanceOf(GoogleFontError);
  });
});
