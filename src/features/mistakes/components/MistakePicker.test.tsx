import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl as render } from "@/i18n/test-utils";
import type { IRollMistake } from "../core";

const setMistakesAction = vi.hoisted(() => vi.fn());
vi.mock("../actions", () => ({ setMistakesAction }));

import { MistakePicker } from "./MistakePicker";

afterEach(() => vi.clearAllMocks());

const m = (type: IRollMistake["type"], frameId: string | null, note: string | null = null): IRollMistake => ({ id: type, frameId, type, note });

describe("MistakePicker (NOTE-2, MistakePicker board)", () => {
  it("shows the 13 types as checkboxes, with the frame's current ones ticked", () => {
    render(<MistakePicker rollId="r1" frameId="f5" framePosition={5} mistakes={[m("light_leak", "f5"), m("wrong_iso", null)]} onDone={vi.fn()} />);
    const group = screen.getByRole("group", { name: "Chọn một hay nhiều lỗi" });
    expect(within(group).getAllByRole("checkbox")).toHaveLength(13);
    expect(screen.getByRole("checkbox", { name: "Lọt sáng" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Sai ISO" })).not.toBeChecked();
    expect(screen.getByRole("heading", { name: "Oops · Tấm 5" })).toBeInTheDocument();
  });

  it("saves several types, each with its note, in one call", async () => {
    setMistakesAction.mockResolvedValue({ ok: true });
    const onDone = vi.fn();
    render(<MistakePicker rollId="r1" frameId="f5" framePosition={5} mistakes={[]} onDone={onDone} />);
    await userEvent.click(screen.getByRole("checkbox", { name: "Lọt sáng" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Rung tay" }));
    await userEvent.type(screen.getByLabelText("Ghi chú · Lọt sáng"), "góc phải");
    await userEvent.click(screen.getByRole("button", { name: "Lưu · giữ tấm này trong cuộn" }));
    expect(setMistakesAction).toHaveBeenCalledTimes(1);
    expect(setMistakesAction).toHaveBeenCalledWith({
      rollId: "r1",
      frameId: "f5",
      items: [{ type: "light_leak", note: "góc phải" }, { type: "camera_shake", note: undefined }],
    });
    expect(onDone).toHaveBeenCalled();
  });

  it("switches to the whole roll", async () => {
    setMistakesAction.mockResolvedValue({ ok: true });
    render(<MistakePicker rollId="r1" frameId="f5" framePosition={5} mistakes={[m("wrong_iso", null)]} onDone={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Cả cuộn" }));
    expect(screen.getByRole("heading", { name: "Oops · Cả cuộn" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Sai ISO" })).toBeChecked();
    await userEvent.click(screen.getByRole("button", { name: "Lưu · giữ tấm này trong cuộn" }));
    expect(setMistakesAction).toHaveBeenCalledWith({ rollId: "r1", frameId: null, items: [{ type: "wrong_iso", note: undefined }] });
  });

  it("clears the oops mark", async () => {
    setMistakesAction.mockResolvedValue({ ok: true });
    render(<MistakePicker rollId="r1" frameId="f5" framePosition={5} mistakes={[m("light_leak", "f5")]} onDone={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Bỏ đánh dấu oops" }));
    expect(setMistakesAction).toHaveBeenCalledWith({ rollId: "r1", frameId: "f5", items: [] });
  });

  it("keeps the picker open with an error when saving fails", async () => {
    setMistakesAction.mockResolvedValue({ ok: false, error: "not_found" });
    const onDone = vi.fn();
    render(<MistakePicker rollId="r1" frameId="f5" framePosition={5} mistakes={[]} onDone={onDone} />);
    await userEvent.click(screen.getByRole("button", { name: "Lưu · giữ tấm này trong cuộn" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Chưa lưu được");
    expect(onDone).not.toHaveBeenCalled();
  });

  describe("bulk mode, N tấm (D13, MistakePickerBulk boards)", () => {
    const frames = [
      { id: "f19", position: 19, gridUrl: "https://img/grid/19.webp", isBlank: false },
      { id: "f22", position: 22, gridUrl: "https://img/grid/22.webp", isBlank: false },
      { id: "f27", position: 27, gridUrl: "https://img/grid/27.webp", isBlank: true },
    ];

    it("has no frame/roll switch, starts with nothing picked, and shows the frames", () => {
      const { container } = render(<MistakePicker bulk={{ frames, onSubmit: vi.fn(), onCancel: vi.fn() }} />);
      expect(screen.getByRole("heading", { name: "Oops cho 3 tấm" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Tấm này" })).toBeNull();
      expect(screen.queryByRole("button", { name: "Cả cuộn" })).toBeNull();
      expect(screen.queryByRole("button", { name: "Bỏ đánh dấu oops" })).toBeNull();
      const group = screen.getByRole("group", { name: "Chọn một hay nhiều lỗi" });
      expect(within(group).getAllByRole("checkbox")).toHaveLength(13);
      expect(within(group).getAllByRole("checkbox").filter((c) => (c as HTMLInputElement).checked)).toHaveLength(0);
      expect(screen.getByText("TẤM 19 · 22 · 27")).toBeInTheDocument();
      expect(container.querySelectorAll("img")).toHaveLength(2);
      expect(screen.getByText(/Lỗi bạn chọn được thêm vào cả 3 tấm\. Lỗi đã gắn trước đó vẫn giữ nguyên/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Lưu · thêm cho 3 tấm" })).toBeDisabled();
    });

    it("passes the picked types, each with its note, to onSubmit instead of saving one frame", async () => {
      const onSubmit = vi.fn().mockResolvedValue({ ok: true });
      render(<MistakePicker bulk={{ frames, onSubmit, onCancel: vi.fn() }} />);
      await userEvent.click(screen.getByRole("checkbox", { name: "Thiếu sáng" }));
      await userEvent.click(screen.getByRole("checkbox", { name: "Lọt sáng" }));
      await userEvent.type(screen.getByLabelText("Ghi chú · Thiếu sáng"), " tối quá ");
      expect(screen.getByLabelText("Ghi chú · Lọt sáng")).toHaveAttribute("placeholder", "ghi chú ngắn, gắn cho cả 3 tấm");
      await userEvent.click(screen.getByRole("button", { name: "Lưu · thêm cho 3 tấm" }));
      expect(onSubmit).toHaveBeenCalledWith([{ type: "light_leak" }, { type: "underexposed", note: "tối quá" }]);
      expect(setMistakesAction).not.toHaveBeenCalled();
    });

    it("keeps the picker open with an error when saving fails or throws, and can retry", async () => {
      const onSubmit = vi.fn().mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce({ ok: false }).mockResolvedValue({ ok: true });
      render(<MistakePicker bulk={{ frames, onSubmit, onCancel: vi.fn() }} />);
      await userEvent.click(screen.getByRole("checkbox", { name: "Lọt sáng" }));
      const save = screen.getByRole("button", { name: "Lưu · thêm cho 3 tấm" });
      await userEvent.click(save);
      expect(await screen.findByRole("alert")).toHaveTextContent("Chưa lưu được");
      expect(save).toBeEnabled();
      await userEvent.click(save);
      expect(screen.getByRole("alert")).toHaveTextContent("Chưa lưu được");
      await userEvent.click(save);
      expect(onSubmit).toHaveBeenCalledTimes(3);
    });

    it("disables save while it is in flight (R22)", async () => {
      let resolve: (v: { ok: boolean }) => void = () => {};
      const onSubmit = vi.fn().mockImplementation(() => new Promise((r) => (resolve = r)));
      render(<MistakePicker bulk={{ frames, onSubmit, onCancel: vi.fn() }} />);
      await userEvent.click(screen.getByRole("checkbox", { name: "Lọt sáng" }));
      await userEvent.click(screen.getByRole("button", { name: "Lưu · thêm cho 3 tấm" }));
      expect(screen.getByRole("button", { name: "Lưu · thêm cho 3 tấm" })).toBeDisabled();
      await userEvent.click(screen.getByRole("button", { name: "Lưu · thêm cho 3 tấm" }));
      expect(onSubmit).toHaveBeenCalledTimes(1);
      resolve({ ok: true });
    });

    it("Huỷ and the close button cancel", async () => {
      const onCancel = vi.fn();
      render(<MistakePicker bulk={{ frames, onSubmit: vi.fn(), onCancel }} />);
      await userEvent.click(screen.getByRole("button", { name: "Huỷ" }));
      await userEvent.click(screen.getByRole("button", { name: "Đóng" }));
      expect(onCancel).toHaveBeenCalledTimes(2);
    });
  });
});
