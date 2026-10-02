import { screen } from "@testing-library/react";
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

  describe("with onOpen (COL-2, Ruling R19)", () => {
    it("makes every cell a button named like the link was, and opens the frame clicked", async () => {
      const onOpen = vi.fn();
      render(<FrameGrid rollId="r1" frames={[frame(1), frame(2, { isKeeper: true })]} onOpen={onOpen} />);
      expect(screen.queryByRole("link")).toBeNull();
      await userEvent.click(screen.getByRole("button", { name: "Tấm 2, tấm ưng" }));
      expect(onOpen).toHaveBeenLastCalledWith(1);
    });

    it("opens with Enter from the keyboard", async () => {
      const onOpen = vi.fn();
      render(<FrameGrid rollId="r1" frames={[frame(1), frame(2)]} onOpen={onOpen} />);
      screen.getByRole("button", { name: "Tấm 1" }).focus();
      await userEvent.keyboard("{Enter}");
      expect(onOpen).toHaveBeenLastCalledWith(0);
    });

    it("keeps the first row eager (the 2 s first-row gate)", () => {
      const frames = Array.from({ length: 8 }, (_, i) => frame(i + 1));
      const { container } = render(<FrameGrid rollId="r1" frames={frames} onOpen={vi.fn()} />);
      const imgs = Array.from(container.querySelectorAll("img"));
      expect(imgs[5]).toHaveAttribute("loading", "eager");
      expect(imgs[6]).toHaveAttribute("loading", "lazy");
    });
  });
});
