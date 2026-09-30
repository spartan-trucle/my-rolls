import { act, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl as render } from "@/i18n/test-utils";
import type { IUploadBatch, IUploadFile } from "../client/queue";
import { UploadTray } from "./UploadTray";

const f = (status: IUploadFile["status"], n = 0): IUploadFile => ({ id: `f${n}-${status}`, name: "a.jpg", bytes: 1, status, progress: 0 });
const batch = (files: IUploadFile[]): IUploadBatch => ({ id: "b", rollId: "r1", startedAt: 0, files });

afterEach(() => vi.useRealTimers());

describe("UploadTray (UploadTray board)", () => {
  it("shows progress while a batch runs and opens the list on the roll", () => {
    const files = [...Array.from({ length: 12 }, (_, i) => f("done", i)), ...Array.from({ length: 24 }, (_, i) => f("queued", i))];
    render(<UploadTray batch={batch(files)} rollLabel="Cuộn #16" />);
    const link = screen.getByRole("link", { name: "Đang tải 12 trên 36 tấm của Cuộn #16, mở danh sách" });
    expect(link).toHaveAttribute("href", "/rolls/r1?upload=1");
    expect(link).toHaveTextContent("Đang tải 12/36");
  });

  it("says done and hides itself 5 s after a clean finish", () => {
    vi.useFakeTimers();
    render(<UploadTray batch={batch([f("done", 1), f("done", 2)])} rollLabel="Cuộn #16" />);
    expect(screen.getByRole("link", { name: /Xong 2\/2/ })).toHaveAttribute("href", "/rolls/r1");
    act(() => vi.advanceTimersByTime(5_000));
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("stays when a file failed, and links back to the list to retry", () => {
    vi.useFakeTimers();
    render(<UploadTray batch={batch([f("done", 1), f("failed", 2), f("failed", 3)])} rollLabel="Cuộn #16" />);
    act(() => vi.advanceTimersByTime(10_000));
    const link = screen.getByRole("link", { name: /1\/3 xong · 2 tấm lỗi/ });
    expect(link).toHaveAttribute("href", "/rolls/r1?upload=1");
  });

  it("renders nothing without a batch", () => {
    render(<UploadTray batch={null} rollLabel="" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
