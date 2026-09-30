import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ISlotRequestFile, IUploadDeps } from "./queue";
import { UploadProvider, useUploads } from "./UploadProvider";

function fakeDeps(): IUploadDeps {
  let release: () => void = () => {};
  const gate = new Promise<void>((r) => (release = r));
  (fakeDeps as unknown as { release: () => void }).release = () => release();
  return {
    makeCopies: vi.fn(async () => {
      await gate;
      return { sha256: "a".repeat(64), width: 1, height: 1, exif: {}, copyType: "image/webp" as const, grid: new Blob(["g"]), view: new Blob(["v"]) };
    }),
    requestSlots: vi.fn(async (_r: string, files: ISlotRequestFile[]) => ({
      slots: files.map((f) => ({ clientId: f.clientId, frameId: "f", originalUrl: "o", gridUrl: "g", viewUrl: "v" })),
    })),
    put: vi.fn(async () => {}),
    confirm: vi.fn(async (ids: string[]) => ({ ready: ids, missing: [] })),
    track: vi.fn(),
    sleep: vi.fn(async () => {}),
    now: () => 0,
  };
}

function Starter() {
  const { batches, start } = useUploads();
  return (
    <div>
      <button onClick={() => start("roll-1", [new File(["x"], "1.jpg", { type: "image/jpeg" })], 1)}>start</button>
      <p>{batches.flatMap((b) => b.files.map((f) => `${f.name}:${f.status}`)).join(",")}</p>
    </div>
  );
}

describe("UploadProvider (D16)", () => {
  it("exposes batches through useUploads and follows the queue", async () => {
    const deps = fakeDeps();
    render(
      <UploadProvider deps={deps}>
        <Starter />
      </UploadProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "start" }));
    expect(screen.getByText("1.jpg:copies")).toBeInTheDocument();
    await act(async () => {
      (fakeDeps as unknown as { release: () => void }).release();
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(await screen.findByText("1.jpg:done")).toBeInTheDocument();
  });

  it("warns before the tab closes while files are in flight, and not after", async () => {
    const deps = fakeDeps();
    render(
      <UploadProvider deps={deps}>
        <Starter />
      </UploadProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "start" }));
    const busy = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(busy);
    expect(busy.defaultPrevented).toBe(true);

    await act(async () => {
      (fakeDeps as unknown as { release: () => void }).release();
      await new Promise((r) => setTimeout(r, 0));
    });
    await screen.findByText("1.jpg:done");
    const calm = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(calm);
    expect(calm.defaultPrevented).toBe(false);
  });

  it("throws a clear error when useUploads is used outside the provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Starter />)).toThrow("useUploads must be used inside UploadProvider");
    spy.mockRestore();
  });
});
