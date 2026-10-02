import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { makeFrame } from "@/features/frames/test-frames";
import { useFrameSelection, useMarkShortcuts } from "./use-frame-selection";

const fr = (id: string) => makeFrame({ id });

describe("useFrameSelection", () => {
  it("click toggles; shift-click selects the range in shown order", () => {
    const shown = ["a", "b", "c", "d"].map(fr);
    const { result } = renderHook(() => useFrameSelection(shown));
    act(() => result.current.click("b", { shift: false }));
    act(() => result.current.click("d", { shift: true }));
    expect([...result.current.selected].sort()).toEqual(["b", "c", "d"]);
    act(() => result.current.click("c", { shift: false }));
    expect([...result.current.selected].sort()).toEqual(["b", "d"]);
  });

  it("drops selected frames that the filter no longer shows (Review Focus 1)", () => {
    let shown = ["a", "b", "c"].map(fr);
    const { result, rerender } = renderHook(() => useFrameSelection(shown));
    act(() => result.current.selectAll());
    shown = [fr("a")];
    rerender();
    expect([...result.current.selected]).toEqual(["a"]);
    expect(result.current.selectedFrames.map((f) => f.id)).toEqual(["a"]);
  });

  it("keeps the selection across a refresh that brings the same frames back (R23)", () => {
    let shown = ["a", "b", "c"].map(fr);
    const { result, rerender } = renderHook(() => useFrameSelection(shown));
    act(() => result.current.click("a", { shift: false }));
    act(() => result.current.click("c", { shift: false }));
    shown = ["a", "b", "c"].map((id) => makeFrame({ id, isKeeper: true }));
    rerender();
    expect(result.current.selectedFrames.map((f) => f.id)).toEqual(["a", "c"]);
    expect(result.current.selectedFrames.every((f) => f.isKeeper)).toBe(true);
  });

  it("clear empties the selection and forgets the anchor", () => {
    const shown = ["a", "b", "c"].map(fr);
    const { result } = renderHook(() => useFrameSelection(shown));
    act(() => result.current.click("a", { shift: false }));
    act(() => result.current.clear());
    expect(result.current.selected.size).toBe(0);
    expect(result.current.anchor).toBeNull();
  });
});

describe("useMarkShortcuts (Review Focus 3)", () => {
  function Harness({ enabled, handlers }: { enabled: boolean; handlers: Parameters<typeof useMarkShortcuts>[1] }) {
    useMarkShortcuts(enabled, handlers);
    return (
      <>
        <input aria-label="note" />
        <textarea aria-label="memory" />
        <div contentEditable aria-label="rich" />
      </>
    );
  }
  const handlers = () => ({ keeper: vi.fn(), oops: vi.fn(), blank: vi.fn(), clear: vi.fn(), selectAll: vi.fn() });

  it("K, O, B, Esc and Ctrl/⌘+A call their handlers", async () => {
    const h = handlers();
    render(<Harness enabled handlers={h} />);
    await userEvent.keyboard("k");
    await userEvent.keyboard("O");
    await userEvent.keyboard("b");
    await userEvent.keyboard("{Escape}");
    await userEvent.keyboard("{Control>}a{/Control}");
    expect([h.keeper, h.oops, h.blank, h.clear, h.selectAll].map((f) => f.mock.calls.length)).toEqual([1, 1, 1, 1, 1]);
    await userEvent.keyboard("{Meta>}a{/Meta}");
    expect(h.selectAll).toHaveBeenCalledTimes(2);
  });

  it("does nothing while typing in an input, textarea or contenteditable", async () => {
    const h = handlers();
    render(<Harness enabled handlers={h} />);
    for (const name of ["note", "memory", "rich"]) {
      await userEvent.click(screen.getByLabelText(name));
      await userEvent.keyboard("kob");
      await userEvent.keyboard("{Control>}a{/Control}");
    }
    expect(h.keeper).not.toHaveBeenCalled();
    expect(h.oops).not.toHaveBeenCalled();
    expect(h.blank).not.toHaveBeenCalled();
    expect(h.selectAll).not.toHaveBeenCalled();
  });

  it("does nothing when disabled (lightbox or a dialog open) or with other modifiers", async () => {
    const h = handlers();
    const { rerender } = render(<Harness enabled={false} handlers={h} />);
    await userEvent.keyboard("k");
    rerender(<Harness enabled handlers={h} />);
    await userEvent.keyboard("{Meta>}k{/Meta}");
    await userEvent.keyboard("{Control>}o{/Control}");
    await userEvent.keyboard("{Alt>}b{/Alt}");
    expect(h.keeper).not.toHaveBeenCalled();
    expect(h.oops).not.toHaveBeenCalled();
    expect(h.blank).not.toHaveBeenCalled();
  });

  it("uses the latest handlers without needing them memoised", async () => {
    const first = handlers();
    const second = handlers();
    const { rerender } = render(<Harness enabled handlers={first} />);
    rerender(<Harness enabled handlers={second} />);
    await userEvent.keyboard("k");
    expect(first.keeper).not.toHaveBeenCalled();
    expect(second.keeper).toHaveBeenCalledTimes(1);
  });
});
