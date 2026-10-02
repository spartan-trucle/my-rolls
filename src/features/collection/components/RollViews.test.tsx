import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CanisterEditor } from "@/features/canister/components/CanisterEditor";
import { makeFrame } from "@/features/frames/test-frames";
import type { IRollEntry } from "@/features/rolls/core";
import { renderWithIntl as render } from "@/i18n/test-utils";
import { RollViews } from "./RollViews";

vi.mock("../actions", () => ({ trackViewSwitchAction: vi.fn() }));
const refresh = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh }) }));

afterEach(() => vi.clearAllMocks());

describe("RollViews (COL-1, COL-2)", () => {
  const frames = [
    makeFrame({ id: "a", position: 1, isKeeper: true }),
    makeFrame({ id: "b", position: 2, isOops: true }),
    makeFrame({ id: "c", position: 3 }),
  ];

  it("Dải phim shows every frame as a film strip; Lưới shows the grid", () => {
    const { rerender } = render(<RollViews rollId="r" frames={frames} view="strip" filter="all" edgeText="GOLD 200 · CUỘN 14" />);
    // R20: RollViews names the region once; FilmStrip's list says how many frames.
    expect(screen.getByRole("region", { name: "Dải phim" })).toContainElement(screen.getByRole("list", { name: "3 tấm" }));
    expect(screen.getAllByRole("region", { name: /Dải phim/ })).toHaveLength(1);
    expect(screen.getByRole("link", { name: /Dải phim/ })).toHaveAttribute("aria-current", "page");
    rerender(<RollViews rollId="r" frames={frames} view="grid" filter="all" edgeText="" />);
    expect(screen.getAllByRole("button", { name: /^Tấm \d/ })).toHaveLength(3);
    expect(screen.getByRole("link", { name: /Lưới/ })).toHaveAttribute("aria-current", "page");
  });

  it("the strip draws no filter chips and ignores the filter", () => {
    render(<RollViews rollId="r" frames={frames} view="strip" filter="oops" edgeText="" />);
    expect(screen.queryByRole("group", { name: "Lọc tấm" })).toBeNull();
    expect(screen.getAllByRole("button", { name: /^Tấm \d/ })).toHaveLength(3);
  });

  it("grid filter chips show counts over the whole roll and filter the cells", () => {
    render(<RollViews rollId="r" frames={frames} view="grid" filter="keeper" edgeText="" />);
    expect(screen.getByRole("link", { name: /Tấm ưng\s*1/ })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: /Tất cả\s*3/ })).toHaveAttribute("href", "/rolls/r?view=grid&filter=all");
    expect(screen.getAllByRole("button", { name: /^Tấm \d/ })).toHaveLength(1);
  });

  it("opening a frame from the filtered grid moves only through the filtered frames (R17)", async () => {
    render(<RollViews rollId="r" frames={frames} view="grid" filter="oops" edgeText="" />);
    await userEvent.dblClick(screen.getByRole("button", { name: /Tấm 2/ }));
    expect(screen.getByText("Tấm 2/3 · Oops 1/1")).toBeInTheDocument(); // position over the roll's total, then within the filter
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByText("Tấm 2/3 · Oops 1/1")).toBeInTheDocument(); // only one oops frame: no move
  });

  it("a tap on a strip frame opens it over the whole roll, and ← → walk the roll", async () => {
    render(<RollViews rollId="r" frames={frames} view="strip" filter="all" edgeText="GOLD 200 · CUỘN 14" />);
    await userEvent.click(screen.getByRole("button", { name: /^Tấm 1/ }));
    expect(screen.getByText("Tấm 1/3")).toBeInTheDocument();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByText("Tấm 2/3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Chi tiết" })).toHaveAttribute("href", "/rolls/r/frames/b");
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("an empty filter says so instead of an empty grid", () => {
    render(<RollViews rollId="r" frames={frames} view="grid" filter="blank" edgeText="" />);
    expect(screen.getByText("Không có tấm nào ở đây")).toBeInTheDocument();
  });

  it.each([
    ["grid", "coarse", "click"],
    ["grid", "fine", "dblClick"],
    ["strip", "fine", "click"],
  ] as const)("returns focus to the %s frame that opened it (%s pointer), even when the %s didn't focus it (Safari, R21)", async (view, pointer, how) => {
    render(<RollViews rollId="r" frames={frames} view={view} filter="all" edgeText="" pointer={pointer} />);
    const cell = screen.getByRole("button", { name: /^Tấm 2/ });
    fireEvent[how](cell); // like Safari: the click doesn't focus the button
    expect(cell).not.toHaveFocus();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(cell).toHaveFocus();
  });
});

describe("bulk marking (COL-4, D11–D13)", () => {
  const frames = Array.from({ length: 6 }, (_, i) => makeFrame({ id: `f${i + 1}`, position: i + 1 }));

  it("selecting frames shows the bar; K marks them tấm ưng in one call", async () => {
    const mark = vi.fn().mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<RollViews rollId="r" frames={frames} view="grid" filter="all" edgeText="" markFrames={mark} />);
    await user.click(screen.getByRole("button", { name: /^Tấm 1/ }));
    await user.keyboard("{Shift>}");
    await user.click(screen.getByRole("button", { name: /^Tấm 3/ }));
    await user.keyboard("{/Shift}");
    expect(screen.getByText("3 tấm đã chọn")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Tấm 2/ })).toHaveAttribute("aria-pressed", "true");
    await user.keyboard("k");
    expect(mark).toHaveBeenCalledWith({ rollId: "r", frameIds: ["f1", "f2", "f3"], mark: "keeper", on: true, via: "key" });
    expect(mark).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(screen.getByText("3 tấm đã chọn")).toBeInTheDocument(); // R23: the selection stays
  });

  it("when every selected frame is already tấm ưng, the button removes it", async () => {
    const mark = vi.fn().mockResolvedValue({ ok: true });
    const keepers = frames.map((f) => ({ ...f, isKeeper: true }));
    render(<RollViews rollId="r" frames={keepers} view="grid" filter="all" edgeText="" markFrames={mark} />);
    await userEvent.click(screen.getByRole("button", { name: /^Tấm 2/ }));
    await userEvent.click(screen.getByRole("button", { name: "Tấm ưng" }));
    expect(mark).toHaveBeenCalledWith(expect.objectContaining({ frameIds: ["f2"], mark: "keeper", on: false, via: "button" }));
  });

  it("Oops opens the mistake picker for all selected frames", async () => {
    const addMistakes = vi.fn().mockResolvedValue({ ok: true });
    render(<RollViews rollId="r" frames={frames} view="grid" filter="all" edgeText="" addMistakes={addMistakes} />);
    await userEvent.click(screen.getByRole("button", { name: /^Tấm 4/ }));
    await userEvent.click(screen.getByRole("button", { name: /^Tấm 5/ }));
    await userEvent.keyboard("o");
    const dialog = await screen.findByRole("dialog", { name: /2 tấm/ });
    // The board's chips are checkboxes and its save says what it does (MistakePickerBulk).
    await userEvent.click(within(dialog).getByRole("checkbox", { name: "Lọt sáng" }));
    await userEvent.click(within(dialog).getByRole("button", { name: "Lưu · thêm cho 2 tấm" }));
    expect(addMistakes).toHaveBeenCalledWith({ rollId: "r", frameIds: ["f4", "f5"], items: [{ type: "light_leak" }], via: "key" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(refresh).toHaveBeenCalled();
    expect(screen.getByText("2 tấm đã chọn")).toBeInTheDocument();
  });

  it("K, O and B do nothing while the mistake picker is open", async () => {
    const mark = vi.fn().mockResolvedValue({ ok: true });
    render(<RollViews rollId="r" frames={frames} view="grid" filter="all" edgeText="" markFrames={mark} />);
    await userEvent.click(screen.getByRole("button", { name: /^Tấm 1/ }));
    await userEvent.click(screen.getByRole("button", { name: "Oops" }));
    await screen.findByRole("dialog", { name: /1 tấm/ });
    await userEvent.keyboard("kb");
    expect(mark).not.toHaveBeenCalled();
  });

  it("a failed save keeps the selection and says so", async () => {
    const mark = vi.fn().mockResolvedValue({ ok: false, error: "not_found" });
    render(<RollViews rollId="r" frames={frames} view="grid" filter="all" edgeText="" markFrames={mark} />);
    await userEvent.click(screen.getByRole("button", { name: /^Tấm 1/ }));
    await userEvent.keyboard("b");
    expect(await screen.findByText("Chưa đánh dấu được, thử lại nhé")).toBeInTheDocument();
    expect(screen.getByText("1 tấm đã chọn")).toBeInTheDocument();
  });

  it("a thrown save (network, redeploy) doesn't leave the bar stuck (R22)", async () => {
    const mark = vi.fn().mockRejectedValueOnce(new Error("network")).mockResolvedValue({ ok: true });
    render(<RollViews rollId="r" frames={frames} view="grid" filter="all" edgeText="" markFrames={mark} />);
    await userEvent.click(screen.getByRole("button", { name: /^Tấm 1/ }));
    await userEvent.keyboard("k");
    expect(await screen.findByRole("alert")).toHaveTextContent("Chưa đánh dấu được, thử lại nhé");
    expect(screen.getByRole("button", { name: "Tấm ưng" })).toBeEnabled();
    await userEvent.click(screen.getByRole("button", { name: "Tấm ưng" }));
    expect(mark).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  });

  it("ignores a second mark while the first is in flight (R22)", async () => {
    let resolve: (v: { ok: true }) => void = () => {};
    const mark = vi.fn().mockImplementation(() => new Promise((r) => (resolve = r)));
    render(<RollViews rollId="r" frames={frames} view="grid" filter="all" edgeText="" markFrames={mark} />);
    await userEvent.click(screen.getByRole("button", { name: /^Tấm 1/ }));
    await userEvent.keyboard("k");
    expect(screen.getByRole("button", { name: "Tấm ưng" })).toBeDisabled();
    await userEvent.keyboard("kb{Escape}");
    expect(mark).toHaveBeenCalledTimes(1);
    expect(screen.getByText("1 tấm đã chọn")).toBeInTheDocument();
    await act(async () => resolve({ ok: true }));
    expect(screen.getByRole("button", { name: "Tấm ưng" })).toBeEnabled();
  });

  it("frames that leave the filter after a mark leave the selection (R23, Review Focus 1)", async () => {
    const mark = vi.fn().mockResolvedValue({ ok: true });
    const keepers = frames.map((f) => ({ ...f, isKeeper: true }));
    const { rerender } = render(<RollViews rollId="r" frames={keepers} view="grid" filter="keeper" edgeText="" markFrames={mark} />);
    await userEvent.click(screen.getByRole("button", { name: /^Tấm 1/ }));
    await userEvent.click(screen.getByRole("button", { name: /^Tấm 2/ }));
    await userEvent.keyboard("k");
    expect(mark).toHaveBeenCalledWith(expect.objectContaining({ frameIds: ["f1", "f2"], on: false }));
    // router.refresh() brings f1 and f2 back without the mark.
    rerender(<RollViews rollId="r" frames={keepers.map((f) => (f.id === "f1" || f.id === "f2" ? { ...f, isKeeper: false } : f))} view="grid" filter="keeper" edgeText="" markFrames={mark} />);
    expect(screen.queryByRole("button", { name: /^Tấm 1/ })).toBeNull();
    expect(screen.queryByText(/tấm đã chọn/)).toBeNull();
  });

  it("Esc clears the selection; Ctrl+A selects every frame shown", async () => {
    render(<RollViews rollId="r" frames={frames} view="grid" filter="all" edgeText="" />);
    await userEvent.keyboard("{Control>}a{/Control}");
    expect(screen.getByText("6 tấm đã chọn")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByText(/tấm đã chọn/)).toBeNull();
  });

  it("on desktop a click selects; double-click and Enter open the lightbox", async () => {
    render(<RollViews rollId="r" frames={frames} view="grid" filter="all" edgeText="" pointer="fine" />);
    await userEvent.click(screen.getByRole("button", { name: /^Tấm 2/ }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText("1 tấm đã chọn")).toBeInTheDocument();
    screen.getByRole("button", { name: /^Tấm 3/ }).focus();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByText("Tấm 3/6")).toBeInTheDocument();
  });

  it("shortcuts are off while the lightbox is open", async () => {
    const mark = vi.fn().mockResolvedValue({ ok: true });
    render(<RollViews rollId="r" frames={frames} view="grid" filter="all" edgeText="" markFrames={mark} />);
    await userEvent.click(screen.getByRole("button", { name: /^Tấm 1/ }));
    await userEvent.dblClick(screen.getByRole("button", { name: /^Tấm 3/ }));
    expect(screen.getByText("Tấm 3/6")).toBeInTheDocument();
    await userEvent.keyboard("k");
    expect(mark).not.toHaveBeenCalled();
  });

  it("shortcuts are off while another dialog on the page (the canister editor) is open (Review Focus 3)", async () => {
    const mark = vi.fn().mockResolvedValue({ ok: true });
    const roll = { id: "r", number: 14, name: "Đà Lạt", canisterColor: "gold", canisterStyle: "stock", stock: null } as unknown as IRollEntry;
    render(
      <>
        <CanisterEditor roll={roll} save={vi.fn()} />
        <RollViews rollId="r" frames={frames} view="grid" filter="all" edgeText="" markFrames={mark} />
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: /^Tấm 1/ }));
    await userEvent.click(screen.getByRole("button", { name: /^Tấm 2/ }));
    await userEvent.click(screen.getByRole("button", { name: /Đổi vỏ cuộn/ }));
    const editor = document.querySelector("dialog[open]") as HTMLElement;
    // Focus still outside the dialog (jsdom's showModal moves none), then inside it on a button.
    for (const target of [document.activeElement as HTMLElement, within(editor).getAllByRole("button")[0]]) {
      target.focus();
      fireEvent.keyDown(target, { key: "k" });
      fireEvent.keyDown(target, { key: "b" });
      expect(fireEvent.keyDown(target, { key: "a", ctrlKey: true })).toBe(true); // native select-all isn't blocked
      fireEvent.keyDown(target, { key: "Escape" });
    }
    expect(mark).not.toHaveBeenCalled();
    expect(screen.getByText("2 tấm đã chọn")).toBeInTheDocument();
  });

  it("long-press on a phone starts selecting; then taps toggle", () => {
    vi.useFakeTimers();
    render(<RollViews rollId="r" frames={frames} view="grid" filter="all" edgeText="" pointer="coarse" />);
    const cell = screen.getByRole("button", { name: /^Tấm 1/ });
    fireEvent.pointerDown(cell, { pointerType: "touch" });
    act(() => vi.advanceTimersByTime(500));
    fireEvent.pointerUp(cell, { pointerType: "touch" });
    fireEvent.click(cell); // the click that ends the long-press doesn't undo it
    expect(screen.getByText("1 tấm đã chọn")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Tấm 2/ }));
    expect(screen.getByText("2 tấm đã chọn")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("a press that moves (a scroll) doesn't select", () => {
    vi.useFakeTimers();
    render(<RollViews rollId="r" frames={frames} view="grid" filter="all" edgeText="" pointer="coarse" />);
    const cell = screen.getByRole("button", { name: /^Tấm 1/ });
    fireEvent.pointerDown(cell, { pointerType: "touch", clientX: 10, clientY: 10 });
    fireEvent.pointerMove(cell, { pointerType: "touch", clientX: 10, clientY: 30 });
    act(() => vi.advanceTimersByTime(600));
    expect(screen.queryByText(/tấm đã chọn/)).toBeNull();
    vi.useRealTimers();
  });

  it("on a phone a tap opens until Chọn is pressed; then taps toggle", async () => {
    render(<RollViews rollId="r" frames={frames} view="grid" filter="all" edgeText="" pointer="coarse" />);
    await userEvent.click(screen.getByRole("button", { name: /^Tấm 2/ }));
    expect(screen.getByText("Tấm 2/6")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    const start = screen.getByRole("button", { name: "Chọn" });
    await userEvent.click(start);
    expect(start).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: /^Tấm 2/ }));
    expect(screen.getByText("1 tấm đã chọn")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Bỏ chọn" }));
    expect(screen.queryByText(/tấm đã chọn/)).toBeNull();
    expect(start).toHaveAttribute("aria-pressed", "false");
  });

  it("the hint under the grid says how to select on each device", () => {
    render(<RollViews rollId="r" frames={frames} view="grid" filter="all" edgeText="" />);
    expect(screen.getByText("Nhấn giữ một tấm để chọn nhiều tấm rồi đánh dấu một lần.")).toBeInTheDocument();
    expect(screen.getByText("Bấm để chọn, giữ Shift để chọn một dãy. Phím K: tấm ưng · O: oops · B: tấm trắng.")).toBeInTheDocument();
  });

  it("the strip has no selection", async () => {
    const mark = vi.fn();
    render(<RollViews rollId="r" frames={frames} view="strip" filter="all" edgeText="" markFrames={mark} />);
    await userEvent.keyboard("{Control>}a{/Control}k");
    expect(mark).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Chọn" })).toBeNull();
  });
});
