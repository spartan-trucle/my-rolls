import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeFrame } from "@/features/frames/test-frames";
import type { IRollEntry } from "@/features/rolls/core";
import { renderWithIntl as render } from "@/i18n/test-utils";
import type { ILibraryPage } from "../core";
import { LibraryGrid } from "./LibraryGrid";

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
// The default `loadMore` is the Server Action; every test that pages passes its own.
vi.mock("../actions", () => ({ listLibraryAction: vi.fn() }));

function makeRollEntry(overrides: Partial<IRollEntry>): IRollEntry {
  return {
    id: "roll-1",
    number: 1,
    name: "Đà Lạt, tháng 10",
    canisterColor: "gold",
    canisterStyle: "stock",
    boxIso: 200,
    shotIso: 200,
    exposures: 36,
    format: "35mm",
    locations: null,
    shotFrom: null,
    shotTo: null,
    memory: null,
    version: 1,
    createdAt: new Date("2025-10-12T12:00:00Z"),
    frameCount: 36,
    pushPull: "0",
    stock: { id: "s", brand: "Kodak", name: "Gold 200", iso: 200, canisterColor: "gold", type: "color-negative" },
    camera: null,
    lens: null,
    ...overrides,
  };
}

const page = (overrides: Partial<ILibraryPage> = {}): ILibraryPage => ({
  totals: { rolls: 3, frames: 108, keepers: 16 },
  counts: { all: 108, keeper: 16, oops: 7 },
  groups: [
    { roll: makeRollEntry({ id: "r2", name: "Hội An", frameCount: 24 }), frames: [makeFrame({ id: "a", position: 1 })] },
    {
      roll: makeRollEntry({ id: "r1", name: "Đà Lạt, tháng 10" }),
      frames: [makeFrame({ id: "b", position: 1 }), makeFrame({ id: "c", position: 2 })],
    },
  ],
  nextCursor: null,
  ...overrides,
});

/** A promise the test settles by hand, to look at the page while a load is in flight. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

afterEach(() => {
  router.push.mockReset();
  router.replace.mockReset();
});

describe("LibraryGrid (COL-3)", () => {
  it("shows one group per roll with a link to the whole roll, and three filters", () => {
    render(<LibraryGrid initial={page()} filter="all" />);
    expect(screen.getAllByRole("link", { name: /Xem cả cuộn/ }).map((l) => l.getAttribute("href"))).toEqual(["/rolls/r2", "/rolls/r1"]);
    expect(screen.queryByRole("link", { name: /Tấm trắng/ })).toBeNull();
    const chips = within(screen.getByRole("group", { name: "Lọc tấm" })).getAllByRole("link");
    expect(chips.map((c) => [c.textContent, c.getAttribute("href")])).toEqual([
      ["Tất cả108", "/?view=grid&filter=all"],
      ["Tấm ưng16", "/?view=grid&filter=keeper"],
      ["Oops7", "/?view=grid&filter=oops"],
    ]);
    expect(chips[0]).toHaveAttribute("aria-current", "true");
  });

  it("heads each group with the roll's name and a mono meta line (LibraryGrid board)", () => {
    const shot = makeRollEntry({ id: "r9", name: null, number: 16, frameCount: 36, shotFrom: new Date("2025-10-12T12:00:00Z") });
    render(<LibraryGrid initial={page({ groups: [{ roll: shot, frames: [makeFrame({ id: "x" })] }] })} filter="all" />);
    expect(screen.getByRole("heading", { level: 2, name: "Cuộn #16" })).toBeInTheDocument();
    expect(screen.getByText("GOLD 200 · 36 TẤM · 12.10.25")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Xem cả cuộn/ })).toHaveAccessibleName("Xem cả cuộn Cuộn #16");
  });

  it("the lightbox moves across rolls in the order shown", async () => {
    render(<LibraryGrid initial={page()} filter="all" />);
    await userEvent.click(screen.getAllByRole("button", { name: /^Tấm 1/ })[0]);
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("dialog")).toHaveAccessibleName(/Tấm 1/);
    expect(screen.getByRole("link", { name: "Chi tiết" })).toHaveAttribute("href", "/rolls/r1/frames/b");
  });

  it("counts each frame over its own roll, not the library (Ruling R26)", async () => {
    render(<LibraryGrid initial={page()} filter="all" />);
    await userEvent.click(screen.getAllByRole("button", { name: /^Tấm 1/ })[0]);
    expect(screen.getByText("Tấm 1/24")).toBeInTheDocument();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByText("Tấm 1/36")).toBeInTheDocument();
  });

  it("names the filter in the lightbox when it isn't 'all' (Ruling R17)", async () => {
    render(<LibraryGrid initial={page()} filter="keeper" />);
    await userEvent.click(screen.getAllByRole("button", { name: /^Tấm 2/ })[0]);
    expect(screen.getByText("Tấm 2/36 · Tấm ưng 3/16")).toBeInTheDocument();
  });

  it("returns focus to the cell that opened the lightbox (R21)", async () => {
    render(<LibraryGrid initial={page()} filter="all" />);
    const cell = screen.getAllByRole("button", { name: /^Tấm 2/ })[0];
    await userEvent.click(cell);
    await userEvent.keyboard("{Escape}");
    expect(cell).toHaveFocus();
  });

  it("'Xem thêm cuộn' loads the next page and appends it", async () => {
    const loadMore = vi.fn().mockResolvedValue(page({ groups: [{ roll: makeRollEntry({ id: "r0", name: "Huế" }), frames: [makeFrame({ id: "z" })] }], nextCursor: null }));
    render(<LibraryGrid initial={page({ nextCursor: "c1" })} filter="keeper" loadMore={loadMore} />);
    await userEvent.click(screen.getByRole("button", { name: "Xem thêm cuộn" }));
    expect(loadMore).toHaveBeenCalledWith({ filter: "keeper", cursor: "c1" });
    expect(await screen.findByText("Huế")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Xem thêm cuộn" })).toBeNull();
  });

  it("doesn't double a group a refresh between pages sends again (Ruling R27)", async () => {
    const again = { roll: makeRollEntry({ id: "r1", name: "Đà Lạt, tháng 10" }), frames: [makeFrame({ id: "b" })] };
    const loadMore = vi.fn().mockResolvedValue(page({ groups: [again, { roll: makeRollEntry({ id: "r0", name: "Huế" }), frames: [makeFrame({ id: "z" })] }] }));
    render(<LibraryGrid initial={page({ nextCursor: "c1" })} filter="all" loadMore={loadMore} />);
    await userEvent.click(screen.getByRole("button", { name: "Xem thêm cuộn" }));
    await screen.findByText("Huế");
    expect(screen.getAllByRole("link", { name: /Xem cả cuộn/ }).map((l) => l.getAttribute("href"))).toEqual(["/rolls/r2", "/rolls/r1", "/rolls/r0"]);
  });

  it("disables 'Xem thêm cuộn' while it loads (Ruling R27)", async () => {
    const next = deferred<ILibraryPage>();
    const loadMore = vi.fn().mockReturnValue(next.promise);
    render(<LibraryGrid initial={page({ nextCursor: "c1" })} filter="all" loadMore={loadMore} />);
    const more = screen.getByRole("button", { name: "Xem thêm cuộn" });
    await userEvent.click(more);
    expect(more).toBeDisabled();
    await userEvent.click(more);
    expect(loadMore).toHaveBeenCalledTimes(1);
    next.resolve(page({ groups: [], nextCursor: "c2" }));
    expect(await screen.findByRole("button", { name: "Xem thêm cuộn" })).toBeEnabled();
  });

  it("says so when a load fails, keeps what's shown and lets the user retry (Ruling R27)", async () => {
    const loadMore = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(page({ groups: [{ roll: makeRollEntry({ id: "r0", name: "Huế" }), frames: [makeFrame({ id: "z" })] }] }));
    render(<LibraryGrid initial={page({ nextCursor: "c1" })} filter="all" loadMore={loadMore} />);
    await userEvent.click(screen.getByRole("button", { name: "Xem thêm cuộn" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Chưa tải được, thử lại nhé.");
    expect(screen.getByText("Hội An")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Xem thêm cuộn" }));
    expect(await screen.findByText("Huế")).toBeInTheDocument();
    expect(loadMore).toHaveBeenLastCalledWith({ filter: "all", cursor: "c1" });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("an empty Tấm ưng library shows its empty state", () => {
    render(<LibraryGrid initial={page({ groups: [], counts: { all: 108, keeper: 0, oops: 7 } })} filter="keeper" />);
    expect(screen.getByText("Chưa có tấm ưng nào")).toBeInTheDocument();
  });

  it("the empty Tấm ưng state points at the newest roll's grid (LibraryGridKeepersEmpty)", () => {
    render(
      <LibraryGrid
        initial={page({ groups: [], counts: { all: 108, keeper: 0, oops: 7 } })}
        filter="keeper"
        newestRoll={{ id: "r1", name: "Đà Lạt, tháng 10" }}
      />,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Chưa có tấm ưng nào" })).toBeInTheDocument();
    expect(screen.getByText(/nhấn giữ những tấm bạn thích/)).toBeInTheDocument();
    expect(screen.getByText(/nhấn K hoặc bấm Tấm ưng/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mở cuộn Đà Lạt, tháng 10" })).toHaveAttribute("href", "/rolls/r1?view=grid");
  });

  it("an empty library with no filter says the shelf has no scans yet", () => {
    render(<LibraryGrid initial={page({ groups: [], counts: { all: 0, keeper: 0, oops: 0 } })} filter="all" />);
    expect(screen.getByText("Chưa có scan nào trên kệ")).toBeInTheDocument();
  });

  it("an empty library under another filter says nothing's there", () => {
    render(<LibraryGrid initial={page({ groups: [] })} filter="oops" />);
    expect(screen.getByText("Không có tấm nào ở đây")).toBeInTheDocument();
  });

  it("has no selection: clicking a cell opens the lightbox (D14)", async () => {
    render(<LibraryGrid initial={page()} filter="all" />);
    const cell = screen.getAllByRole("button", { name: /^Tấm 1/ })[0];
    expect(cell).not.toHaveAttribute("aria-pressed");
    await userEvent.click(cell);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByText(/tấm đã chọn/)).toBeNull();
  });

  it("loads only the first group's first row eagerly (the 2 s first-row gate)", () => {
    const many = Array.from({ length: 8 }, (_, i) => makeFrame({ id: `m${i}`, position: i + 1 }));
    const { container } = render(
      <LibraryGrid
        initial={page({
          groups: [
            { roll: makeRollEntry({ id: "r2" }), frames: many },
            { roll: makeRollEntry({ id: "r1" }), frames: [makeFrame({ id: "y" })] },
          ],
        })}
        filter="all"
      />,
    );
    const imgs = Array.from(container.querySelectorAll("ol img"));
    expect(imgs.map((i) => i.getAttribute("loading"))).toEqual(["eager", "eager", "eager", "eager", "eager", "eager", "lazy", "lazy", "lazy"]);
    expect(imgs[0]).toHaveAttribute("src", many[0].gridUrl);
  });
});
