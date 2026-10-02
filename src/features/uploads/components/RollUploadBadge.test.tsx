import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl as render } from "@/i18n/test-utils";
import type { IUploadBatch, IUploadFile } from "../client/queue";

const uploads = vi.hoisted(() => ({ batches: [] as IUploadBatch[] }));
vi.mock("../client/UploadProvider", () => ({ useUploads: () => uploads }));

import { RollUploadBadge } from "./RollUploadBadge";

const f = (status: IUploadFile["status"], n: number): IUploadFile => ({ id: `${status}${n}`, name: "a", bytes: 1, status, progress: 0 });

describe("RollUploadBadge (HomeUploading board)", () => {
  it("shows done/total while this roll uploads", () => {
    uploads.batches = [{ id: "b", rollId: "r1", startedAt: 0, files: [f("done", 1), f("queued", 2), f("queued", 3)] }];
    render(<RollUploadBadge rollId="r1" frameCount={0} />);
    expect(screen.getByLabelText("Đang tải 1 trên 3 tấm")).toHaveTextContent("1/3");
  });

  it("shows the failures once the batch ends with some", () => {
    uploads.batches = [{ id: "b", rollId: "r1", startedAt: 0, files: [f("done", 1), f("failed", 2), f("failed", 3)] }];
    render(<RollUploadBadge rollId="r1" frameCount={1} />);
    expect(screen.getByLabelText("2 tấm lỗi")).toHaveTextContent("2 lỗi");
  });

  it("otherwise shows the roll's frame count, and nothing without frames", () => {
    uploads.batches = [];
    const { rerender } = render(<RollUploadBadge rollId="r1" frameCount={36} />);
    expect(screen.getByText("36 tấm")).toBeInTheDocument();
    rerender(<RollUploadBadge rollId="r1" frameCount={0} />);
    expect(screen.queryByText(/tấm/)).not.toBeInTheDocument();
  });

  it("shows the waiting slot for a roll with no frames and no upload (Shelf board's Chờ scan)", () => {
    uploads.batches = [];
    render(<RollUploadBadge rollId="r1" frameCount={0} waiting={<span>chờ</span>} />);
    expect(screen.getByText("chờ")).toBeInTheDocument();
  });

  it("drops the waiting slot once an upload starts", () => {
    uploads.batches = [{ id: "b", rollId: "r1", startedAt: 0, files: [f("queued", 1)] }];
    render(<RollUploadBadge rollId="r1" frameCount={0} waiting={<span>chờ</span>} />);
    expect(screen.queryByText("chờ")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Đang tải 0 trên 1 tấm")).toBeInTheDocument();
  });

  it("prints the frame count as plain text, not a stamp (Shelf board)", () => {
    uploads.batches = [];
    render(<RollUploadBadge rollId="r1" frameCount={12} />);
    expect(screen.getByText("12 tấm").tagName).toBe("SPAN");
    expect(screen.getByText("12 tấm").className).not.toMatch(/stamp/);
  });
});
