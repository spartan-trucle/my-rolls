// @vitest-environment node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const loadGoogleFontFiles = vi.hoisted(() => vi.fn());

vi.mock("@/lib/google-font", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/google-font")>();
  return { ...actual, loadGoogleFontFiles };
});

// A real, valid TTF — Satori rejects fake bytes (`Unsupported OpenType
// signature`) and needs at least one font to lay text out at all. Borrowed
// from next/og's own bundled default font rather than committing a font
// file to this repo (D31: no font files in the repo) just for a test.
let realFontBytes: ArrayBuffer;

beforeAll(async () => {
  const fontPath = path.join(
    path.dirname(require.resolve("next/dist/compiled/@vercel/og/index.node.js")),
    "Geist-Regular.ttf",
  );
  const buffer = await readFile(fontPath);
  realFontBytes = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
});

function stubFontFiles() {
  loadGoogleFontFiles.mockResolvedValue([
    { weight: 400, data: realFontBytes },
    { weight: 700, data: realFontBytes },
  ]);
}

describe("GET /spike/og", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("returns a 1080x1920 PNG (real ImageResponse render, real sample photo and font bytes; pixel-level diacritics are checked by eye per the plan, not here)", async () => {
    stubFontFiles();

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");

    const bytes = new Uint8Array(await response.arrayBuffer());
    const view = new DataView(bytes.buffer);
    // PNG IHDR: width at byte 16, height at byte 20, both big-endian uint32.
    expect(view.getUint32(16)).toBe(1080);
    expect(view.getUint32(20)).toBe(1920);
  });

  it("sets an immutable, one-year Cache-Control header on success", async () => {
    stubFontFiles();

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
  });

  it("sets X-Robots-Tag: noindex (D30)", async () => {
    stubFontFiles();

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.headers.get("x-robots-tag")).toBe("noindex");
  });

  it("returns 503 when Google Fonts is unreachable (D31: no fallback font)", async () => {
    const { GoogleFontError } = await import("@/lib/google-font");
    loadGoogleFontFiles.mockRejectedValue(new GoogleFontError("Google Fonts CSS2 API is unreachable"));

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(503);
  });
});
