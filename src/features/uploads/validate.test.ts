import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES } from "./limits";
import { validateFiles } from "./validate";

const file = (name: string, bytes: number, type = "image/jpeg") =>
  new File([new Uint8Array(bytes)], name, { type });

describe("validateFiles", () => {
  it("accepts JPEG, PNG and WebP at exactly 10 MB", () => {
    const files = [
      file("a.jpg", MAX_UPLOAD_BYTES),
      file("b.png", 10, "image/png"),
      file("c.webp", 10, "image/webp"),
    ];
    expect(validateFiles(files)).toEqual({ accepted: files, rejected: [] });
  });

  it("rejects one byte over 10 MB with its name and size", () => {
    const big = file("01.jpg", MAX_UPLOAD_BYTES + 1);
    expect(validateFiles([big]).rejected).toEqual([
      { name: "01.jpg", bytes: MAX_UPLOAD_BYTES + 1, reason: "too_big" },
    ]);
  });

  it("rejects TIFF and HEIC as wrong_type", () => {
    const { rejected } = validateFiles([file("a.tif", 10, "image/tiff"), file("b.heic", 10, "image/heic")]);
    expect(rejected.map((r) => r.reason)).toEqual(["wrong_type", "wrong_type"]);
  });

  it("ignores hidden files from a dropped folder", () => {
    expect(validateFiles([file(".DS_Store", 10, "")])).toEqual({ accepted: [], rejected: [] });
  });
});
