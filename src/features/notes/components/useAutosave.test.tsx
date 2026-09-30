import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAutosave } from "./useAutosave";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useAutosave (D20)", () => {
  it("saves once, 800 ms after the last change", async () => {
    const save = vi.fn().mockResolvedValue({ ok: true, updatedAt: new Date("2026-11-12T07:02:00Z") });
    const { result } = renderHook(() => useAutosave(save, { delay: 800 }));
    act(() => result.current.change("a"));
    act(() => vi.advanceTimersByTime(500));
    act(() => result.current.change("ab"));
    act(() => vi.advanceTimersByTime(799));
    expect(save).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith("ab");
    expect(result.current.state).toBe("saved");
    expect(result.current.savedAt).toEqual(new Date("2026-11-12T07:02:00Z"));
  });

  it("saves at once on blur, and not again when the timer would have fired", async () => {
    const save = vi.fn().mockResolvedValue({ ok: true, updatedAt: new Date() });
    const { result } = renderHook(() => useAutosave(save, { delay: 800 }));
    act(() => result.current.change("x"));
    await act(async () => {
      await result.current.flush();
    });
    await act(async () => {
      vi.advanceTimersByTime(2_000);
    });
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("goes to error when the save fails, keeping the value to retry", async () => {
    const save = vi.fn().mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true, updatedAt: new Date() });
    const { result } = renderHook(() => useAutosave(save, { delay: 800 }));
    act(() => result.current.change("keep me"));
    await act(async () => {
      vi.advanceTimersByTime(800);
    });
    expect(result.current.state).toBe("error");
    await act(async () => {
      await result.current.retry();
    });
    expect(save).toHaveBeenLastCalledWith("keep me");
    expect(result.current.state).toBe("saved");
  });

  it("does nothing on blur when nothing changed", async () => {
    const save = vi.fn();
    const { result } = renderHook(() => useAutosave(save, { delay: 800 }));
    await act(async () => {
      await result.current.flush();
    });
    expect(save).not.toHaveBeenCalled();
  });
});
