import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl as render } from "@/i18n/test-utils";

const saveNoteAction = vi.hoisted(() => vi.fn());
vi.mock("../actions", () => ({ saveNoteAction }));

import { FrameNotes } from "./FrameNotes";

describe("FrameNotes (FrameView's notes)", () => {
  it("lists this frame's notes and adds one on Enter", async () => {
    saveNoteAction.mockResolvedValue({ ok: true, id: "n2", updatedAt: new Date(), deleted: false });
    render(
      <FrameNotes
        rollId="r1"
        frameId="f5"
        notes={[{ id: "n1", body: "sương đẹp", frameId: "f5", framePosition: 5, createdAt: new Date("2026-10-13T03:00:00Z"), updatedAt: new Date() }]}
      />,
    );
    expect(screen.getByRole("heading", { name: "Ghi chú tấm này" })).toBeInTheDocument();
    expect(screen.getByText("sương đẹp")).toBeInTheDocument();
    const input = screen.getByLabelText("Thêm ghi chú cho tấm này");
    await userEvent.type(input, "lọt sáng góc phải{Enter}");
    expect(saveNoteAction).toHaveBeenCalledWith({ rollId: "r1", frameId: "f5", body: "lọt sáng góc phải" });
    expect(await screen.findByText("lọt sáng góc phải")).toBeInTheDocument();
    expect(input).toHaveValue("");
  });

  it("saves once when Enter is followed by a blur before the save returns (review #7)", async () => {
    let finish: (v: unknown) => void = () => {};
    saveNoteAction.mockReset();
    saveNoteAction.mockImplementation(() => new Promise((r) => (finish = r)));
    render(<FrameNotes rollId="r1" frameId="f5" notes={[]} />);
    const input = screen.getByLabelText("Thêm ghi chú cho tấm này");
    await userEvent.type(input, "lọt sáng{Enter}");
    await userEvent.tab();
    finish({ ok: true, id: "n3", updatedAt: new Date(), deleted: false });
    expect(await screen.findByText("lọt sáng")).toBeInTheDocument();
    expect(saveNoteAction).toHaveBeenCalledTimes(1);
  });
});
