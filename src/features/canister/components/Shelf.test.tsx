import { screen, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import type { IRollEntry } from "@/features/rolls/core";
import { UploadProvider } from "@/features/uploads/client/UploadProvider";
import { renderWithIntl } from "@/i18n/test-utils";
import { Shelf } from "./Shelf";

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
    frameCount: 0,
    pushPull: "0",
    stock: { id: "s", brand: "Fujifilm", name: "Superia 400", iso: 400, canisterColor: "green", type: "color-negative" },
    camera: null,
    lens: null,
    ...overrides,
  };
}

const render = (ui: ReactElement) => renderWithIntl(<UploadProvider>{ui}</UploadProvider>);

describe("Shelf (CAN-1)", () => {
  it("shows every roll as a canister link, newest first, including rolls with no scans", () => {
    const rolls = [
      makeRollEntry({ id: "r2", name: "Hội An", frameCount: 0 }),
      makeRollEntry({ id: "r1", name: "Đà Lạt, tháng 10", frameCount: 36 }),
    ];
    render(<Shelf rolls={rolls} />);
    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual(["/rolls/r2", "/rolls/r1"]);
    expect(within(links[0]).getByText("Chờ scan")).toBeInTheDocument();
    expect(within(links[1]).getByText("36 tấm")).toBeInTheDocument();
  });

  it("names each link with the roll and its film, and describes it with the scan status", () => {
    render(<Shelf rolls={[makeRollEntry({ id: "r2", name: "Hội An", frameCount: 0 })]} />);
    const link = screen.getByRole("link", { name: "Hội An, Fujifilm Superia 400" });
    expect(link).toHaveAccessibleDescription("Chờ scan");
  });

  it("names an unnamed roll Cuộn #N on its label and in its link name", () => {
    render(<Shelf rolls={[makeRollEntry({ id: "r3", name: null, number: 3 })]} />);
    expect(screen.getByRole("link", { name: /Cuộn #3/ })).toBeInTheDocument();
    expect(screen.getByText("Cuộn #3")).toBeInTheDocument();
  });

  it("puts the stock name beside the canister as text, never on it", () => {
    render(
      <Shelf
        rolls={[makeRollEntry({ stock: { id: "s", brand: "Kodak", name: "Gold 200", iso: 200, canisterColor: "gold", type: "color-negative" } })]}
      />,
    );
    const stock = screen.getByText("Kodak Gold 200");
    expect(stock.closest("[aria-hidden='true']")).toBeNull();
    expect(screen.getByText("C-41 · 200").closest("[aria-hidden='true']")).not.toBeNull();
  });

  it("names a roll with no stock by itself alone", () => {
    render(<Shelf rolls={[makeRollEntry({ name: "Hội An", stock: null })]} />);
    expect(screen.getByRole("link", { name: "Hội An" })).toBeInTheDocument();
  });

  it("shows the empty shelf with a placeholder canister and both ways to add a roll", () => {
    render(<Shelf rolls={[]} />);
    expect(screen.getByRole("heading", { level: 2, name: "Kệ còn trống" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Lên kệ cuộn đầu tiên" })).toHaveAttribute("href", "/rolls/new");
    expect(screen.getByRole("link", { name: "Thêm cuộn đã chụp" })).toHaveAttribute("href", "/rolls/new?mode=past");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
