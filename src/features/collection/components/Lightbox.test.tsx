import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeFrame } from "@/features/frames/test-frames";
import { renderWithIntl as render } from "@/i18n/test-utils";
import { Lightbox, type LightboxProps } from "./Lightbox";

const frames = [1, 2, 3].map((n) => makeFrame({ id: `f${n}`, position: n }));

function setup(index = 0, extra: Partial<LightboxProps> = {}) {
  const onIndexChange = vi.fn();
  const onClose = vi.fn();
  const utils = render(
    <Lightbox frames={frames} index={index} onIndexChange={onIndexChange} onClose={onClose} detailHref={(f) => `/rolls/r/frames/${f.id}`} {...extra} />,
  );
  return { onIndexChange, onClose, ...utils };
}

afterEach(() => vi.restoreAllMocks());

describe("Lightbox (COL-2, D10)", () => {
  it("shows the 2048 px copy and 'Tấm 2/3'", () => {
    setup(1);
    expect(screen.getByRole("img")).toHaveAttribute("src", frames[1].viewUrl);
    expect(screen.getByText("Tấm 2/3")).toBeInTheDocument();
  });

  it("counts over the roll, and within the filter it was opened from (Ruling R17)", () => {
    const oops = [3, 14, 33].map((n) => makeFrame({ position: n, isOops: true }));
    render(<Lightbox frames={oops} index={0} total={36} filterLabel="Oops" onIndexChange={vi.fn()} onClose={vi.fn()} detailHref={() => "/x"} />);
    expect(screen.getByText("Tấm 3/36 · Oops 1/3")).toBeInTheDocument();
  });

  it("→ and ← move; Esc closes", async () => {
    const { onIndexChange, onClose } = setup(1);
    await userEvent.keyboard("{ArrowRight}");
    expect(onIndexChange).toHaveBeenLastCalledWith(2);
    await userEvent.keyboard("{ArrowLeft}");
    expect(onIndexChange).toHaveBeenLastCalledWith(0);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("doesn't wrap at either end", async () => {
    const { onIndexChange } = setup(2);
    await userEvent.keyboard("{ArrowRight}");
    expect(onIndexChange).not.toHaveBeenCalled();
    // The ‹ › buttons are desktop-only (phones swipe), so hidden in this phone-first render.
    expect(screen.getByLabelText("Tấm sau")).toBeDisabled();
  });

  it("a horizontal swipe over 50 px moves; a short or vertical drag doesn't", () => {
    const { onIndexChange } = setup(1);
    const stage = screen.getByTestId("lightbox-stage");
    fireEvent.pointerDown(stage, { clientX: 300, clientY: 200, pointerId: 1 });
    fireEvent.pointerUp(stage, { clientX: 200, clientY: 210, pointerId: 1 });
    expect(onIndexChange).toHaveBeenLastCalledWith(2);
    onIndexChange.mockClear();
    fireEvent.pointerDown(stage, { clientX: 300, clientY: 200, pointerId: 1 });
    fireEvent.pointerUp(stage, { clientX: 280, clientY: 400, pointerId: 1 });
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it("is a modal dialog that labels a blank frame and links to the frame's details", () => {
    render(<Lightbox frames={[makeFrame({ id: "b", position: 36, isBlank: true })]} index={0} onIndexChange={vi.fn()} onClose={vi.fn()} detailHref={() => "/x"} />);
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("img", { name: "Tấm 36, trắng" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Chi tiết" })).toHaveAttribute("href", "/x");
  });

  it("shows the frame's tấm ưng and oops stamps", () => {
    render(<Lightbox frames={[makeFrame({ isKeeper: true, isOops: true })]} index={0} onIndexChange={vi.fn()} onClose={vi.fn()} detailHref={() => "/x"} />);
    expect(screen.getByRole("img", { name: "Tấm ưng" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Oops" })).toBeInTheDocument();
  });

  describe("history and focus", () => {
    it("closing with its own button drops the history entry it pushed, once", async () => {
      const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
      const { onClose } = setup(0);
      expect(window.history.state).toMatchObject({ cuonLightbox: true });
      await userEvent.click(screen.getByRole("button", { name: "Đóng" }));
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(back).toHaveBeenCalledTimes(1);
      // The pop that back() causes must not close it a second time.
      act(() => {
        window.dispatchEvent(new PopStateEvent("popstate"));
      });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("phone Back (popstate) closes it without going back again", () => {
      const back = vi.spyOn(window.history, "back").mockImplementation(() => {});
      const { onClose } = setup(0);
      act(() => {
        window.dispatchEvent(new PopStateEvent("popstate"));
      });
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(back).not.toHaveBeenCalled();
    });

    it("moves focus in on open and back to the opener on close", () => {
      const opener = document.createElement("button");
      document.body.append(opener);
      opener.focus();
      const { unmount } = setup(0);
      expect(screen.getByRole("dialog")).toContainElement(document.activeElement as HTMLElement);
      unmount();
      expect(opener).toHaveFocus();
      opener.remove();
    });

    it("keeps Tab inside the dialog", async () => {
      setup(1);
      const dialog = screen.getByRole("dialog");
      for (let i = 0; i < 8; i += 1) {
        await userEvent.tab();
        expect(dialog).toContainElement(document.activeElement as HTMLElement);
      }
      await userEvent.tab({ shift: true });
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    });
  });
});
