import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl as render } from "@/i18n/test-utils";
import type { IRollFrame } from "../core";
import { FrameGrid } from "./FrameGrid";

const frame = (n: number, patch: Partial<IRollFrame> = {}): IRollFrame => ({
  id: `f${n}`,
  position: n,
  gridUrl: `https://img/grid/${n}.webp`,
  viewUrl: `https://img/view/${n}.webp`,
  width: 3000,
  height: 2000,
  isKeeper: false,
  isBlank: false,
  isOops: false,
  noteCount: 0,
  ...patch,
});

describe("FrameGrid (RollFrames board)", () => {
  it("links every frame to its FrameView, numbered", () => {
    render(<FrameGrid rollId="r1" frames={[frame(1), frame(2)]} />);
    expect(screen.getByRole("link", { name: "Tấm 1" })).toHaveAttribute("href", "/rolls/r1/frames/f1");
    expect(screen.getByRole("link", { name: "Tấm 2" })).toHaveAttribute("href", "/rolls/r1/frames/f2");
  });

  it("marks tấm ưng and oops with labelled icons, and draws a blank frame without its image", () => {
    render(<FrameGrid rollId="r1" frames={[frame(1, { isKeeper: true, isOops: true }), frame(2, { isBlank: true })]} />);
    expect(screen.getByRole("link", { name: "Tấm 1, tấm ưng, oops" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Tấm ưng" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Oops" })).toBeInTheDocument();
    const blank = screen.getByRole("link", { name: "Tấm 2, tấm trắng" });
    expect(blank.querySelector("img")).toBeNull();
  });

  it("loads the first row eagerly and the rest lazily, with sizes set (F3 speed)", () => {
    const frames = Array.from({ length: 8 }, (_, i) => frame(i + 1));
    const { container } = render(<FrameGrid rollId="r1" frames={frames} />);
    const imgs = Array.from(container.querySelectorAll("img"));
    expect(imgs[0]).toHaveAttribute("loading", "eager");
    expect(imgs[5]).toHaveAttribute("loading", "eager");
    expect(imgs[6]).toHaveAttribute("loading", "lazy");
    expect(imgs[0]).toHaveAttribute("width", "3000");
    expect(imgs[0]).toHaveAttribute("height", "2000");
    expect(imgs[0]).toHaveAttribute("src", "https://img/grid/1.webp");
  });

  it("takes how many cells load eagerly (the library: only its first group's first row)", () => {
    const frames = Array.from({ length: 3 }, (_, i) => frame(i + 1));
    const { container } = render(<FrameGrid rollId="r1" frames={frames} eager={0} />);
    for (const img of container.querySelectorAll("img")) expect(img).toHaveAttribute("loading", "lazy");
  });

  describe("with onOpen (COL-2, Ruling R19)", () => {
    it("makes every cell a button named like the link was, and opens the frame clicked", async () => {
      const onOpen = vi.fn();
      render(<FrameGrid rollId="r1" frames={[frame(1), frame(2, { isKeeper: true })]} onOpen={onOpen} />);
      expect(screen.queryByRole("link")).toBeNull();
      const cell = screen.getByRole("button", { name: "Tấm 2, tấm ưng" });
      await userEvent.click(cell);
      expect(onOpen).toHaveBeenLastCalledWith(1, cell);
    });

    it("opens with Enter from the keyboard", async () => {
      const onOpen = vi.fn();
      render(<FrameGrid rollId="r1" frames={[frame(1), frame(2)]} onOpen={onOpen} />);
      screen.getByRole("button", { name: "Tấm 1" }).focus();
      await userEvent.keyboard("{Enter}");
      expect(onOpen).toHaveBeenLastCalledWith(0, screen.getByRole("button", { name: "Tấm 1" }));
    });

    it("keeps the first row eager (the 2 s first-row gate)", () => {
      const frames = Array.from({ length: 8 }, (_, i) => frame(i + 1));
      const { container } = render(<FrameGrid rollId="r1" frames={frames} onOpen={vi.fn()} />);
      const imgs = Array.from(container.querySelectorAll("img"));
      expect(imgs[5]).toHaveAttribute("loading", "eager");
      expect(imgs[6]).toHaveAttribute("loading", "lazy");
    });
  });

  describe("with selection (COL-4, D11)", () => {
    const frames = [frame(1), frame(2), frame(3, { isBlank: true })];

    it("draws a selected cell pressed, with the ring and the tick", () => {
      render(<FrameGrid rollId="r1" frames={frames} onOpen={vi.fn()} selectedIds={new Set(["f2"])} onToggle={vi.fn()} onLongPress={vi.fn()} />);
      const cell = screen.getByRole("button", { name: /^Tấm 2/ });
      expect(cell).toHaveAttribute("aria-pressed", "true");
      expect(cell).toHaveClass("selected");
      expect(cell.querySelector(".tick")).not.toBeNull();
      expect(screen.getByRole("button", { name: /^Tấm 1/ })).toHaveAttribute("aria-pressed", "false");
    });

    it("fine pointer: a click toggles (with Shift for a range); double-click and Enter open", async () => {
      const onOpen = vi.fn();
      const onToggle = vi.fn();
      const user = userEvent.setup();
      render(<FrameGrid rollId="r1" frames={frames} onOpen={onOpen} selectedIds={new Set()} pointer="fine" onToggle={onToggle} onLongPress={vi.fn()} />);
      const cell = screen.getByRole("button", { name: /^Tấm 2/ });
      await user.click(cell);
      expect(onToggle).toHaveBeenLastCalledWith("f2", { shift: false });
      await user.keyboard("{Shift>}");
      await user.click(cell);
      await user.keyboard("{/Shift}");
      expect(onToggle).toHaveBeenLastCalledWith("f2", { shift: true });
      expect(onOpen).not.toHaveBeenCalled();
      await user.dblClick(cell);
      expect(onOpen).toHaveBeenLastCalledWith(1, cell);
      onOpen.mockClear();
      onToggle.mockClear();
      cell.focus();
      await user.keyboard("{Enter}");
      expect(onOpen).toHaveBeenLastCalledWith(1, cell);
      expect(onToggle).not.toHaveBeenCalled();
    });

    it("coarse pointer: a tap opens unless selecting, then it toggles", async () => {
      const onOpen = vi.fn();
      const onToggle = vi.fn();
      const { rerender } = render(
        <FrameGrid rollId="r1" frames={frames} onOpen={onOpen} selectedIds={new Set()} pointer="coarse" selecting={false} onToggle={onToggle} onLongPress={vi.fn()} />,
      );
      await userEvent.click(screen.getByRole("button", { name: /^Tấm 1/ }));
      expect(onOpen).toHaveBeenCalledTimes(1);
      expect(onToggle).not.toHaveBeenCalled();
      rerender(<FrameGrid rollId="r1" frames={frames} onOpen={onOpen} selectedIds={new Set()} pointer="coarse" selecting onToggle={onToggle} onLongPress={vi.fn()} />);
      await userEvent.click(screen.getByRole("button", { name: /^Tấm 1/ }));
      expect(onToggle).toHaveBeenLastCalledWith("f1", { shift: false });
      expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it("a 500 ms press selects and swallows the click after it; a shorter one doesn't", () => {
      vi.useFakeTimers();
      const onOpen = vi.fn();
      const onLongPress = vi.fn();
      render(<FrameGrid rollId="r1" frames={frames} onOpen={onOpen} selectedIds={new Set()} pointer="coarse" selecting={false} onToggle={vi.fn()} onLongPress={onLongPress} />);
      const cell = screen.getByRole("button", { name: /^Tấm 1/ });
      fireEvent.pointerDown(cell, { pointerType: "touch" });
      act(() => vi.advanceTimersByTime(499));
      fireEvent.pointerUp(cell, { pointerType: "touch" });
      expect(onLongPress).not.toHaveBeenCalled();
      fireEvent.pointerDown(cell, { pointerType: "touch" });
      act(() => vi.advanceTimersByTime(500));
      fireEvent.pointerUp(cell, { pointerType: "touch" });
      fireEvent.click(cell);
      expect(onLongPress).toHaveBeenCalledWith("f1");
      expect(onOpen).not.toHaveBeenCalled();
      vi.useRealTimers();
    });

    it("keeps long-press callouts off the cells", () => {
      const { container } = render(<FrameGrid rollId="r1" frames={frames} onOpen={vi.fn()} selectedIds={new Set()} pointer="coarse" onToggle={vi.fn()} onLongPress={vi.fn()} />);
      for (const img of Array.from(container.querySelectorAll("img"))) expect(img).toHaveAttribute("draggable", "false");
      const menu = fireEvent.contextMenu(screen.getByRole("button", { name: /^Tấm 1/ }));
      expect(menu).toBe(false); // default prevented
    });
  });
});
