import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { makeFrame } from "@/features/frames/test-frames";
import { renderWithIntl as render } from "@/i18n/test-utils";
import { RollViews } from "./RollViews";

vi.mock("../actions", () => ({ rememberViewAction: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

describe("RollViews (COL-1, COL-2)", () => {
  const frames = [
    makeFrame({ id: "a", position: 1, isKeeper: true }),
    makeFrame({ id: "b", position: 2, isOops: true }),
    makeFrame({ id: "c", position: 3 }),
  ];

  it("Dải phim shows every frame as a film strip; Lưới shows the grid", () => {
    const { rerender } = render(<RollViews rollId="r" frames={frames} view="strip" filter="all" edgeText="GOLD 200 · CUỘN 14" />);
    expect(screen.getByRole("region", { name: /Dải phim/ })).toBeInTheDocument();
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
});
