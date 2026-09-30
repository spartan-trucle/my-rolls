import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl as render } from "@/i18n/test-utils";
import type { IRollNote } from "../core";

const actions = vi.hoisted(() => ({ saveMemoryAction: vi.fn(), saveNoteAction: vi.fn(), deleteNoteAction: vi.fn() }));
vi.mock("../actions", () => actions);

import { NotesMemory } from "./NotesMemory";

const note = (id: string, body: string, patch: Partial<IRollNote> = {}): IRollNote => ({
  id,
  body,
  frameId: null,
  framePosition: null,
  createdAt: new Date("2026-10-12T03:00:00Z"),
  updatedAt: new Date("2026-10-12T03:00:00Z"),
  ...patch,
});

afterEach(() => vi.clearAllMocks());

const renderIt = (notes: IRollNote[] = []) =>
  render(<NotesMemory rollId="r1" rollTitle="Đà Lạt, tháng 10" memory="Đi Đà Lạt" notes={notes} />);

describe("NotesMemory (NOTE-1, NotesMemory board)", () => {
  it("shows the memory in a labelled field and saves it when you leave it", async () => {
    actions.saveMemoryAction.mockResolvedValue({ ok: true, updatedAt: new Date("2026-11-12T07:02:00Z") });
    renderIt();
    const memo = screen.getByLabelText("Kỷ niệm của cuộn này");
    expect(memo).toHaveValue("Đi Đà Lạt");
    await userEvent.type(memo, " với Minh");
    await userEvent.tab();
    expect(actions.saveMemoryAction).toHaveBeenCalledWith({ rollId: "r1", memory: "Đi Đà Lạt với Minh" });
    expect(await screen.findByText(/Đã lưu 14:02/)).toBeInTheDocument();
  });

  it("keeps the text and says so when the save fails", async () => {
    actions.saveMemoryAction.mockResolvedValue({ ok: false, error: "not_found" });
    renderIt();
    const memo = screen.getByLabelText("Kỷ niệm của cuộn này");
    await userEvent.type(memo, "!");
    await userEvent.tab();
    expect(await screen.findByText("Chưa lưu, thử lại")).toBeInTheDocument();
    expect(memo).toHaveValue("Đi Đà Lạt!");
  });

  it("lists notes with their date and a link to their frame", () => {
    renderIt([note("n1", "sương đẹp nhất", { frameId: "f14", framePosition: 14 }), note("n2", "đo sáng vùng tối")]);
    expect(screen.getByRole("heading", { name: "Ghi chú · 2" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tấm 14 ›" })).toHaveAttribute("href", "/rolls/r1/frames/f14");
    expect(screen.getAllByText("12.10")).toHaveLength(2);
  });

  it("adds a note from the composer", async () => {
    actions.saveNoteAction.mockResolvedValue({ ok: true, id: "n9", updatedAt: new Date(), deleted: false });
    renderIt();
    await userEvent.type(screen.getByLabelText("Ghi chú mới"), "lab ám xanh");
    await userEvent.click(screen.getByRole("button", { name: "Lưu ghi chú" }));
    expect(actions.saveNoteAction).toHaveBeenCalledWith({ rollId: "r1", body: "lab ám xanh" });
    expect(await screen.findByText("lab ám xanh")).toBeInTheDocument();
    expect(screen.getByLabelText("Ghi chú mới")).toHaveValue("");
  });

  it("deletes a note", async () => {
    actions.deleteNoteAction.mockResolvedValue({ ok: true });
    renderIt([note("n1", "xoá tôi")]);
    await userEvent.click(screen.getByRole("button", { name: "Xoá ghi chú: xoá tôi" }));
    expect(actions.deleteNoteAction).toHaveBeenCalledWith({ noteId: "n1" });
    expect(screen.queryByText("xoá tôi")).not.toBeInTheDocument();
  });

  it("edits a note in place", async () => {
    actions.saveNoteAction.mockResolvedValue({ ok: true, id: "n1", updatedAt: new Date(), deleted: false });
    renderIt([note("n1", "cũ")]);
    await userEvent.click(screen.getByRole("button", { name: "Sửa ghi chú: cũ" }));
    const field = screen.getByLabelText("Sửa ghi chú");
    await userEvent.clear(field);
    await userEvent.type(field, "mới");
    await userEvent.tab();
    expect(actions.saveNoteAction).toHaveBeenCalledWith({ noteId: "n1", rollId: "r1", body: "mới" });
  });
});
