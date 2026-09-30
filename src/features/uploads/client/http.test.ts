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
