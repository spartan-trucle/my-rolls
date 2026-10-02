import { describe, expect, it } from "vitest";
import type { IUploadBatch } from "../client/queue";
import { formatBytesVi, summarizeBatch } from "./format";

describe("formatBytesVi", () => {
  it("writes MB with a comma and one decimal", () => {
    expect(formatBytesVi(25_480_000)).toBe("24,3 MB");
    expect(formatBytesVi(4_300_000)).toBe("4,1 MB");
  });

  it("writes KB under 1 MB", () => {
    expect(formatBytesVi(512_000)).toBe("500 KB");
  });
});

describe("summarizeBatch", () => {
  const f = (status: IUploadBatch["files"][number]["status"]) => ({ id: status, name: "x", bytes: 1, status, progress: 0 });

  it("counts done, moving, waiting, failed and rejected; total excludes rejected", () => {
    const batch: IUploadBatch = {
      id: "b",
      rollId: "r",
      startedAt: 0,
      files: [f("done"), f("done"), f("uploading"), f("copies"), f("confirming"), f("queued"), f("failed"), f("rejected")],
    };
    expect(summarizeBatch(batch)).toEqual({ done: 2, moving: 3, waiting: 1, failed: 1, rejected: 1, total: 7, finished: false });
  });

  it("is finished when nothing is queued or moving", () => {
    const batch: IUploadBatch = { id: "b", rollId: "r", startedAt: 0, files: [f("done"), f("failed"), f("rejected")] };
    expect(summarizeBatch(batch).finished).toBe(true);
  });
});
