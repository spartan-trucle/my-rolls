/// <reference lib="webworker" />
import exifr from "exifr";
import { stripGps } from "../strip-gps";
import { fitLongEdge } from "./fit";

/**
 * Phase 2 plan D11–D13: runs off the main thread. For one original it returns the 480 px and
 * 2048 px copies (WebP, or JPEG where the browser can't encode WebP), the SHA-256 and the EXIF
 * without GPS. Copies drawn on a canvas carry no metadata. Checked on devices in S1; jsdom
 * has no OffscreenCanvas, so there's no unit test here.
 */

const GRID_EDGE = 480;
const VIEW_EDGE = 2048;

async function encode(bitmap: ImageBitmap, max: number, type: "image/webp" | "image/jpeg"): Promise<Blob> {
  const size = fitLongEdge(bitmap.width, bitmap.height, max);
  const canvas = new OffscreenCanvas(size.width, size.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, size.width, size.height);
  return canvas.convertToBlob({ type, quality: type === "image/webp" ? 0.82 : 0.85 });
}

async function makeCopies(file: File) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    let copyType: "image/webp" | "image/jpeg" = "image/webp";
    let view = await encode(bitmap, VIEW_EDGE, copyType);
    // A browser without a WebP encoder hands back a PNG; use JPEG instead (D11).
    if (view.type !== "image/webp") {
      copyType = "image/jpeg";
      view = await encode(bitmap, VIEW_EDGE, copyType);
    }
    const grid = await encode(bitmap, GRID_EDGE, copyType);
    const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
    const sha256 = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
    const exif = stripGps(((await exifr.parse(file, { gps: false }).catch(() => null)) ?? {}) as Record<string, unknown>);
    return { sha256, width: bitmap.width, height: bitmap.height, exif, copyType, grid, view };
  } finally {
    bitmap.close();
  }
}

self.onmessage = async (event: MessageEvent<{ id: number; file: File }>) => {
  const { id, file } = event.data;
  try {
    self.postMessage({ id, ok: true, result: await makeCopies(file) });
  } catch (err) {
    self.postMessage({ id, ok: false, error: err instanceof Error ? err.message : String(err) });
  }
};
