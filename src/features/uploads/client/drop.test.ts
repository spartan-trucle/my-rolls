import { describe, expect, it } from "vitest";
import { collectDroppedFiles } from "./drop";

const file = (name: string) => new File(["x"], name, { type: "image/jpeg" });

/** A minimal FileSystemEntry tree like Chrome and Safari hand over for a dropped folder. */
function fileEntry(f: File) {
  return { isFile: true, isDirectory: false, file: (ok: (f: File) => void) => ok(f) };
}
function dirEntry(children: unknown[]) {
  let read = false;
  return {
    isFile: false,
    isDirectory: true,
    createReader: () => ({
      readEntries: (ok: (e: unknown[]) => void) => {
        ok(read ? [] : children);
        read = true;
      },
    }),
  };
}

describe("collectDroppedFiles (SCAN-2: drop a folder)", () => {
  it("walks a dropped folder, nested ones too", async () => {
    const items = [
      { kind: "file", webkitGetAsEntry: () => dirEntry([fileEntry(file("01.jpg")), dirEntry([fileEntry(file("02.jpg"))])]) },
    ];
    const files = await collectDroppedFiles({ items, files: [] } as unknown as DataTransfer);
    expect(files.map((f) => f.name).sort()).toEqual(["01.jpg", "02.jpg"]);
  });

  it("falls back to dataTransfer.files when entries aren't available", async () => {
    const files = await collectDroppedFiles({ items: undefined, files: [file("a.jpg")] } as unknown as DataTransfer);
    expect(files.map((f) => f.name)).toEqual(["a.jpg"]);
  });
});
