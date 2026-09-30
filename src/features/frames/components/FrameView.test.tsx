import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl as render } from "@/i18n/test-utils";
import type { IRollFrame } from "../core";

const actions = vi.hoisted(() => ({
  setFrameMarksAction: vi.fn(),
  moveFrameAction: vi.fn(),
  deleteFrameAction: vi.fn(),
  restoreFrameAction: vi.fn(),
}));
const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("../actions", () => actions);
vi.mock("next/navigation", () => ({ useRouter: () => router }));

import { FrameView } from "./FrameView";

const frame = (n: number, patch: Partial<IRollFrame> = {}): IRollFrame => ({
  id: `f${n}`,
  position: n,
  gridUrl: `g${n}`,
  viewUrl: `https://img/view/${n}.webp`,
  width: 3000,
  height: 2000,
  isKeeper: false,
  isBlank: false,
  isOops: false,
  noteCount: 0,
  ...patch,
});
const frames = [frame(1), frame(2), frame(3)];

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

const renderAt = (index: number, list = frames) =>
  render(<FrameView rollId="r1" rollLabel="Cuộn #16" frames={list} index={index} />);

describe("FrameView (FrameView board)", () => {
  it("shows the view copy, 'Tấm n/total', and links the original at 100%", () => {
    renderAt(1);
    expect(screen.getByText("Tấm 2/3")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Tấm 2" })).toHaveAttribute("src", "https://img/view/2.webp");
    expect(screen.getByRole("link", { name: /Xem bản gốc 100%/ })).toHaveAttribute("href", "/api/frames/f2/original");
  });

  it("moves between frames with the buttons and the arrow keys", async () => {
    renderAt(1);
    expect(screen.getByRole("link", { name: "Tấm trước" })).toHaveAttribute("href", "/rolls/r1/frames/f1");
    expect(screen.getByRole("link", { name: "Tấm sau" })).toHaveAttribute("href", "/rolls/r1/frames/f3");
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(router.push).toHaveBeenCalledWith("/rolls/r1/frames/f3");
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(router.push).toHaveBeenCalledWith("/rolls/r1/frames/f1");
  });

  it("toggles tấm ưng at once and keeps it when the save works", async () => {
    actions.setFrameMarksAction.mockResolvedValue({ ok: true });
    renderAt(0);
    const keeper = screen.getByRole("button", { name: /Tấm ưng/ });
    expect(keeper).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(keeper);
    expect(keeper).toHaveAttribute("aria-pressed", "true");
    expect(actions.setFrameMarksAction).toHaveBeenCalledWith({ frameId: "f1", isKeeper: true });
  });

  it("rolls the toggle back when the save fails", async () => {
    actions.setFrameMarksAction.mockResolvedValue({ ok: false, error: "not_found" });
    renderAt(0);
    const keeper = screen.getByRole("button", { name: /Tấm ưng/ });
    await userEvent.click(keeper);
    expect(keeper).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("alert")).toHaveTextContent("Chưa lưu được");
  });

  it("marking blank clears tấm ưng on screen too (D3)", async () => {
    actions.setFrameMarksAction.mockResolvedValue({ ok: true });
    renderAt(0, [frame(1, { isKeeper: true })]);
    await userEvent.click(screen.getByRole("button", { name: "Tấm trắng" }));
    expect(screen.getByRole("button", { name: "Tấm trắng" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Tấm ưng/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("moves the frame to a new position", async () => {
    actions.moveFrameAction.mockResolvedValue({ ok: true });
    renderAt(2);
    await userEvent.click(screen.getByRole("button", { name: /Đổi vị trí/ }));
    const input = screen.getByLabelText("Vị trí mới");
    await userEvent.clear(input);
    await userEvent.type(input, "1");
    await userEvent.click(screen.getByRole("button", { name: "Chuyển" }));
    expect(actions.moveFrameAction).toHaveBeenCalledWith({ frameId: "f3", toPosition: 1 });
    expect(router.refresh).toHaveBeenCalled();
  });

  it("deletes with 5 s to undo, then goes on", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    actions.deleteFrameAction.mockResolvedValue({ ok: true });
    actions.restoreFrameAction.mockResolvedValue({ ok: true });
    renderAt(1);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    await user.click(screen.getByRole("button", { name: "Xoá tấm này" }));
    expect(actions.deleteFrameAction).toHaveBeenCalledWith({ frameId: "f2" });
    await user.click(screen.getByRole("button", { name: "Hoàn tác" }));
    expect(actions.restoreFrameAction).toHaveBeenCalledWith({ frameId: "f2" });
    expect(router.push).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Xoá tấm này" }));
    await act(async () => {
      vi.advanceTimersByTime(5_000);
    });
    expect(router.push).toHaveBeenCalledWith("/rolls/r1/frames/f3");
  });
});
