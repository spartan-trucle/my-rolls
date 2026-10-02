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
});
