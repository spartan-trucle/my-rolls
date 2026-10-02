import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { renderWithIntl as render } from "@/i18n/test-utils";
import type { IUploadBatch } from "../client/queue";

const uploads = vi.hoisted(() => ({
  batches: [] as IUploadBatch[],
  start: vi.fn(() => "b1"),
  retry: vi.fn(),
  retryAll: vi.fn(),
}));
vi.mock("../client/UploadProvider", () => ({ useUploads: () => uploads }));
const refresh = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { RollUploadSection } from "./RollUploadSection";

beforeAll(() => {
  // jsdom has no <dialog> modal methods.
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  };
});

describe("RollUploadSection", () => {
  it("starts a batch after the roll's last frame and opens the list", async () => {
    uploads.start.mockImplementation(() => {
      uploads.batches = [{ id: "b1", rollId: "r1", rollLabel: "Cuộn #16", startedAt: 0, files: [] }];
      return "b1";
    });
    const { rerender } = render(<RollUploadSection rollId="r1" rollLabel="Cuộn #16" frameCount={12} onOpenScanSet={vi.fn()} />);
    const input = screen.getByLabelText(/Thả cuộn vào đây/);
    const files = [new File(["x"], "13.jpg", { type: "image/jpeg" })];
    await userEvent.upload(input, files);
    expect(uploads.start).toHaveBeenCalledWith("r1", files, 13, "Cuộn #16");
    rerender(<RollUploadSection rollId="r1" rollLabel="Cuộn #16" frameCount={12} onOpenScanSet={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Tải scan · Cuộn #16" })).toBeInTheDocument();
  });

  it("accepts only JPEG, PNG and WebP in the file picker (D1)", () => {
    uploads.batches = [];
    render(<RollUploadSection rollId="r1" rollLabel="Cuộn #16" frameCount={0} onOpenScanSet={vi.fn()} />);
    expect(screen.getByLabelText(/Thả cuộn vào đây/)).toHaveAttribute("accept", "image/jpeg,image/png,image/webp");
  });

  it("opens the list for this roll's batch when asked to (the tray's ?upload=1)", () => {
    uploads.batches = [{ id: "b9", rollId: "r1", rollLabel: "Cuộn #16", startedAt: 0, files: [] }];
    render(<RollUploadSection rollId="r1" rollLabel="Cuộn #16" frameCount={0} onOpenScanSet={vi.fn()} initialOpen />);
    expect(screen.getByRole("heading", { name: "Tải scan · Cuộn #16" })).toBeInTheDocument();
  });

  it("reads a dropped folder through the drop zone", async () => {
    uploads.batches = [];
    uploads.start.mockClear();
    render(<RollUploadSection rollId="r1" rollLabel="Cuộn #16" frameCount={0} onOpenScanSet={vi.fn()} />);
    const f = new File(["x"], "01.jpg", { type: "image/jpeg" });
    const entry = { isFile: true, isDirectory: false, file: (ok: (x: File) => void) => ok(f) };
    fireEvent.drop(screen.getByLabelText(/Thả cuộn vào đây/).closest("label")!, {
      dataTransfer: { items: [{ kind: "file", webkitGetAsEntry: () => entry }], files: [f] },
    });
    await vi.waitFor(() => expect(uploads.start).toHaveBeenCalledWith("r1", [f], 1, "Cuộn #16"));
  });

  it("refreshes the roll page once when this roll's batch finishes, so new frames show (review #2)", () => {
    const f = (status: "queued" | "done") => ({ id: status, name: "a.jpg", bytes: 1, status, progress: 0 });
    uploads.batches = [{ id: "b1", rollId: "r1", startedAt: 0, files: [f("queued")] }];
    const { rerender } = render(<RollUploadSection rollId="r1" rollLabel="Cuộn #16" frameCount={0} />);
    expect(refresh).not.toHaveBeenCalled();
    uploads.batches = [{ id: "b1", rollId: "r1", startedAt: 0, files: [f("done")] }];
    rerender(<RollUploadSection rollId="r1" rollLabel="Cuộn #16" frameCount={0} />);
    rerender(<RollUploadSection rollId="r1" rollLabel="Cuộn #16" frameCount={0} />);
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
