import { describe, expect, it } from "vitest";
import { nextMarkValue, pruneToShown, selectRange, toggleId } from "./selection";

describe("toggleId", () => {
  it("adds then removes, without mutating its input", () => {
    const start = new Set(["a"]);
    expect([...toggleId(start, "b")]).toEqual(["a", "b"]);
    expect([...toggleId(start, "a")]).toEqual([]);
    expect([...start]).toEqual(["a"]);
  });
});

describe("selectRange (Review Focus 2)", () => {
  // The filter hides c and e; the user sees a, b, d, f.
  const shown = ["a", "b", "d", "f"];

  it("selects from the anchor to the click in shown order, either direction", () => {
    expect([...selectRange(shown, "b", "f", new Set(["b"]))].sort()).toEqual(["b", "d", "f"]);
    expect([...selectRange(shown, "f", "a", new Set())].sort()).toEqual(["a", "b", "d", "f"]);
  });

  it("never selects frames the filter hides", () => {
    expect(selectRange(shown, "a", "f", new Set()).has("c")).toBe(false);
  });

  it("with no anchor, or an anchor no longer shown, acts like a toggle", () => {
    expect([...selectRange(shown, null, "d", new Set())]).toEqual(["d"]);
    expect([...selectRange(shown, "c", "d", new Set())]).toEqual(["d"]);
  });

  it("keeps an existing selection outside the range", () => {
    expect([...selectRange(shown, "d", "f", new Set(["a", "d"]))].sort()).toEqual(["a", "d", "f"]);
  });
});

describe("pruneToShown (Review Focus 1)", () => {
  it("drops ids that left the filtered list", () => {
    expect([...pruneToShown(new Set(["a", "b", "z"]), ["a", "c"])]).toEqual(["a"]);
  });
});

describe("nextMarkValue (D12)", () => {
  const m = (isKeeper: boolean, isBlank = false) => ({ isKeeper, isBlank, isOops: false });

  it("sets the mark when any selected frame lacks it", () => {
    expect(nextMarkValue([m(true), m(false)], "keeper")).toBe(true);
  });

  it("removes it when every selected frame has it", () => {
    expect(nextMarkValue([m(true), m(true)], "keeper")).toBe(false);
    expect(nextMarkValue([m(false, true)], "blank")).toBe(false);
  });

  it("an empty selection sets nothing", () => {
    expect(nextMarkValue([], "keeper")).toBe(true);
  });
});
