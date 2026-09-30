import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl as render } from "@/i18n/test-utils";
import type { IUploadBatch, IUploadFile } from "../client/queue";
import { UploadList } from "./UploadList";

const file = (n: number, patch: Partial<IUploadFile> = {}): IUploadFile => ({
  id: `f${n}`,
  name: `LLAB_16_${String(n).padStart(2, "0")}.jpg`,
  bytes: 4_300_000,
  status: "done",
  progress: 1,
  ...patch,
});

function batch(files: IUploadFile[]): IUploadBatch {
  return { id: "b1", rollId: "r1", startedAt: 0, files };
}

const handlers = () => ({ onRetry: vi.fn(), onRetryAll: vi.fn(), onOpenScanSet: vi.fn(), onMinimize: vi.fn() });

describe("UploadList (UploadScans board)", () => {
  it("shows the totals line and a progress bar out of the accepted files", () => {
    const files = [
      file(1),
      file(2),
      file(3, { status: "uploading", progress: 0.64 }),
      file(4, { status: "queued", progress: 0 }),
      file(5, { status: "failed", error: "put", progress: 0 }),
    ];
    render(<UploadList batch={batch(files)} title="Tải scan · Cuộn #16" {...handlers()} />);
    expect(screen.getByText("2/5 XONG · 1 ĐANG TẢI · 1 CHỜ · 1 LỖI")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "2 trên 5 tấm đã xong" })).toHaveAttribute("aria-valuenow", "2");
  });

  it("lists a failed file with its reason, and retries it alone or with the rest", async () => {
    const h = handlers();
    const files = [file(1, { status: "failed", error: "put" }), file(2, { status: "failed", error: "confirm" })];
    render(<UploadList batch={batch(files)} title="t" {...h} />);
    expect(screen.getByText("Mất kết nối giữa chừng")).toBeInTheDocument();
    expect(screen.getByText("R2 không nhận tệp")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Thử lại LLAB_16_01.jpg" }));
    expect(h.onRetry).toHaveBeenCalledWith("f1");
    await userEvent.click(screen.getByRole("button", { name: "Thử lại tất cả" }));
    expect(h.onRetryAll).toHaveBeenCalledWith("b1");
  });

  it("shows moving files with their stage, and folds the waiting list after 3", () => {
    const files = [
      file(1, { status: "copies", progress: 0 }),
      file(2, { status: "uploading", progress: 0.08 }),
      ...[3, 4, 5, 6, 7].map((n) => file(n, { status: "queued", progress: 0 })),
    ];
    render(<UploadList batch={batch(files)} title="t" {...handlers()} />);
    expect(screen.getByText("Đang tạo bản xem")).toBeInTheDocument();
    expect(screen.getByText("Đang tải 8%")).toBeInTheDocument();
    expect(screen.getByText("+ 2 tấm nữa đang chờ")).toBeInTheDocument();
  });

  it("explains files over 10 MB, which were never sent, with name and size", () => {
    const files = [
      file(1),
      file(7, { name: "LLAB_16_07.tif", bytes: 25_480_000, status: "rejected", error: "too_big" }),
    ];
    render(<UploadList batch={batch(files)} title="t" {...handlers()} />);
    expect(screen.getByRole("alert")).toHaveTextContent("1 tệp quá 10 MB, không tải.");
    expect(screen.getByText("LLAB_16_07.tif")).toBeInTheDocument();
    expect(screen.getByText("24,3 MB")).toBeInTheDocument();
    expect(screen.getByText(/Nhận JPEG, PNG, WebP, mỗi tệp tối đa 10 MB/)).toBeInTheDocument();
  });

  it("opens the scan-set form from the lab row and minimizes to the tray", async () => {
    const h = handlers();
    render(<UploadList batch={batch([file(1)])} title="t" {...h} />);
    await userEvent.click(screen.getByRole("button", { name: /Lab nào tráng cuộn này\?/ }));
    expect(h.onOpenScanSet).toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Thu nhỏ" }));
    expect(h.onMinimize).toHaveBeenCalled();
  });
});
