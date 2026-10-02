import { afterEach, describe, expect, it, vi } from "vitest";
import { confirmUploads, requestUploadSlots } from "./http";

afterEach(() => vi.unstubAllGlobals());

describe("upload http deps", () => {
  it("posts slot requests as JSON and returns the slots", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ scanSetId: "s", slots: [] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(requestUploadSlots("roll-1", [])).resolves.toEqual({ scanSetId: "s", slots: [] });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/uploads/slots");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ rollId: "roll-1", files: [] });
  });

  it("throws on a non-2xx slot response, so the queue fails those files with 'slot'", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "too_many" }), { status: 400 })));
    await expect(requestUploadSlots("roll-1", [])).rejects.toThrow("too_many");
  });

  it("confirms frame ids", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ready: ["f1"], missing: [] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(confirmUploads(["f1"])).resolves.toEqual({ ready: ["f1"], missing: [] });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/uploads/confirm");
  });
});

describe("putObject timeout (review #5)", () => {
  it("sets an XHR timeout that grows with the body, so a stalled PUT fails instead of hanging", async () => {
    const created: Array<{ timeout: number }> = [];
    class FakeXHR {
      timeout = 0;
      upload = { onprogress: null };
      status = 200;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      ontimeout: (() => void) | null = null;
      constructor() {
        created.push(this);
      }
      open() {}
      setRequestHeader() {}
      send() {
        this.ontimeout?.();
      }
    }
    vi.stubGlobal("XMLHttpRequest", FakeXHR);
    const { putObject } = await import("./http");
    await expect(putObject("https://r2/put", new Blob([new Uint8Array(10 * 1024 * 1024)]), "image/jpeg")).rejects.toThrow("timeout");
    await putObject("https://r2/put", new Blob(["x"]), "image/jpeg").catch(() => {});
    expect(created[0].timeout).toBeGreaterThan(created[1].timeout);
    expect(created[1].timeout).toBeGreaterThanOrEqual(60_000);
  });
});
