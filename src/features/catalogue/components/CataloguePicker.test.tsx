import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";

const searchCatalogue = vi.hoisted(() => vi.fn());
const listCatalogue = vi.hoisted(() => vi.fn());
const addToBag = vi.hoisted(() => vi.fn());

vi.mock("@/features/catalogue/actions", () => ({ searchCatalogue, listCatalogue }));
vi.mock("@/features/bag/actions", () => ({ addToBag }));

import { CataloguePicker } from "./CataloguePicker";

const GOLD_200 = {
  kind: "stock" as const,
  id: "stock-1",
  brand: "Kodak",
  name: "Gold 200",
  iso: 200,
  formats: ["35mm"],
  type: "color-negative",
  canisterColor: "gold",
};

const K1000 = {
  kind: "camera" as const,
  id: "cam-1",
  brand: "Pentax",
  model: "K1000",
  type: "slr",
  format: "35mm",
};

function setup(extraProps: Partial<ComponentProps<typeof CataloguePicker>> = {}) {
  const user = userEvent.setup();
  const onPicked = vi.fn();
  const onAddCustom = vi.fn();
  renderWithIntl(<CataloguePicker onPicked={onPicked} onAddCustom={onAddCustom} {...extraProps} />);
  return { user, onPicked, onAddCustom };
}

describe("CataloguePicker", () => {
  beforeEach(() => {
    listCatalogue.mockResolvedValue({ ok: true, entries: [] });
  });

  afterEach(() => {
    searchCatalogue.mockReset();
    listCatalogue.mockReset();
    addToBag.mockReset();
  });

  it("lists the catalogue (listCatalogue) before anything is typed, not a search", async () => {
    listCatalogue.mockResolvedValue({ ok: true, entries: [GOLD_200] });
    setup();

    expect(await screen.findByRole("button", { name: "Kodak Gold 200" })).toBeInTheDocument();
    expect(listCatalogue).toHaveBeenCalledWith({ kind: "stock" });
    expect(searchCatalogue).not.toHaveBeenCalled();
  });

  it("typing replaces the list with search results", async () => {
    listCatalogue.mockResolvedValue({ ok: true, entries: [GOLD_200] });
    searchCatalogue.mockResolvedValue({ ok: true, entries: [K1000] });
    const { user } = setup();

    await screen.findByRole("button", { name: "Kodak Gold 200" });

    await user.type(screen.getByLabelText("Tìm trong danh mục"), "k1000");

    expect(await screen.findByRole("button", { name: "Pentax K1000" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Kodak Gold 200" })).not.toBeInTheDocument();
  });

  it("clearing the search box brings the list back", async () => {
    listCatalogue.mockResolvedValue({ ok: true, entries: [GOLD_200] });
    searchCatalogue.mockResolvedValue({ ok: true, entries: [K1000] });
    const { user } = setup();

    const input = screen.getByLabelText("Tìm trong danh mục");
    await user.type(input, "k1000");
    await screen.findByRole("button", { name: "Pentax K1000" });

    await user.clear(input);

    expect(await screen.findByRole("button", { name: "Kodak Gold 200" })).toBeInTheDocument();
  });

  it("only the results list scrolls, not the whole dialog (fix 2's constant-height box)", () => {
    setup();

    // The results container is the only flex-grow / overflow-y region;
    // header and controls stay outside it, so `document.querySelector`
    // (rather than a role/text query) is the honest way to assert this
    // structural property.
    const results = document.querySelector('[class*="results"]');
    expect(results).not.toBeNull();
    expect(results?.querySelector('[class*="header"]')).toBeNull();
    expect(results?.querySelector('input')).toBeNull();
  });

  it("debounces the search (~200ms) and calls it with the current kind", async () => {
    searchCatalogue.mockResolvedValue({ ok: true, entries: [] });
    const { user } = setup();

    await user.type(screen.getByLabelText("Tìm trong danh mục"), "gold");
    expect(searchCatalogue).not.toHaveBeenCalled();

    await waitFor(() => expect(searchCatalogue).toHaveBeenCalledWith({ kind: "stock", q: "gold" }));
  });

  it("switches kind via the segment and re-runs the search for the new kind", async () => {
    searchCatalogue.mockResolvedValue({ ok: true, entries: [] });
    const { user } = setup();

    await user.type(screen.getByLabelText("Tìm trong danh mục"), "k1000");
    await waitFor(() => expect(searchCatalogue).toHaveBeenCalledWith({ kind: "stock", q: "k1000" }));

    await user.click(screen.getByRole("button", { name: "Máy ảnh" }));
    await waitFor(() => expect(searchCatalogue).toHaveBeenCalledWith({ kind: "camera", q: "k1000" }));
  });

  it("shows results, then picking one calls addToBag and onPicked", async () => {
    searchCatalogue.mockResolvedValue({ ok: true, entries: [GOLD_200] });
    addToBag.mockResolvedValue({ ok: true, bagItemId: "bag-1" });
    const { user, onPicked } = setup();

    await user.type(screen.getByLabelText("Tìm trong danh mục"), "gold");

    const result = await screen.findByRole("button", { name: "Kodak Gold 200" });
    await user.click(result);

    expect(addToBag).toHaveBeenCalledWith({ kind: "stock", refId: "stock-1" });
    await waitFor(() => expect(onPicked).toHaveBeenCalledWith(GOLD_200));
    expect(await screen.findByText("Trong túi")).toBeInTheDocument();
  });

  it("shows the stock type as a Vietnamese label, never the raw slug", async () => {
    searchCatalogue.mockResolvedValue({ ok: true, entries: [GOLD_200] });
    const { user } = setup();

    await user.type(screen.getByLabelText("Tìm trong danh mục"), "gold");

    expect(await screen.findByText(/Màu âm/)).toBeInTheDocument();
    expect(screen.queryByText(/color-negative/)).not.toBeInTheDocument();
  });

  it("doesn't call addToBag again for an item already in the bag", async () => {
    searchCatalogue.mockResolvedValue({ ok: true, entries: [GOLD_200] });
    addToBag.mockResolvedValue({ ok: true, bagItemId: "bag-1" });
    const { user } = setup();

    await user.type(screen.getByLabelText("Tìm trong danh mục"), "gold");

    const result = await screen.findByRole("button", { name: "Kodak Gold 200" });
    await user.click(result);
    await waitFor(() => expect(result).toBeDisabled());

    await user.click(result);
    expect(addToBag).toHaveBeenCalledTimes(1);
  });

  it("shows the camera icon and its own custom-entry prompt for camera results", async () => {
    searchCatalogue.mockResolvedValue({ ok: true, entries: [K1000] });
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "Máy ảnh" }));
    await user.type(screen.getByLabelText("Tìm trong danh mục"), "k1000");

    expect(await screen.findByRole("button", { name: "Pentax K1000" })).toBeInTheDocument();
    expect(screen.getByText("Không thấy máy của bạn?")).toBeInTheDocument();
    expect(screen.getByText(/Máy cơ SLR/)).toBeInTheDocument();
  });

  it("shows the no-match state and opens the custom form prefilled with the typed text", async () => {
    searchCatalogue.mockResolvedValue({ ok: true, entries: [] });
    const { user, onAddCustom } = setup();

    await user.type(screen.getByLabelText("Tìm trong danh mục"), "aerocolor");

    expect(await screen.findByText("Danh mục chưa có “aerocolor”.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "+ Thêm film riêng" }));
    expect(onAddCustom).toHaveBeenCalledWith("stock", "aerocolor");
  });

  it("clears the search from the no-match state, back to the list", async () => {
    listCatalogue.mockResolvedValue({ ok: true, entries: [GOLD_200] });
    searchCatalogue.mockResolvedValue({ ok: true, entries: [] });
    const { user } = setup();

    const input = screen.getByLabelText("Tìm trong danh mục");
    await user.type(input, "aerocolor");
    await screen.findByText("Danh mục chưa có “aerocolor”.");

    await user.click(screen.getByRole("button", { name: "Xoá ô tìm, xem cả danh mục" }));

    await waitFor(() => expect(input).toHaveValue(""));
    expect(await screen.findByRole("button", { name: "Kodak Gold 200" })).toBeInTheDocument();
  });

  it("C1: shows the result count above a search's hits", async () => {
    searchCatalogue.mockResolvedValue({ ok: true, entries: [GOLD_200] });
    const { user } = setup();

    await user.type(screen.getByLabelText("Tìm trong danh mục"), "gold");

    expect(await screen.findByText("1 kết quả cho “gold”")).toBeInTheDocument();
  });

  it("BAG-2 (N6): shows '×N' for a stock already counted in the bag", async () => {
    listCatalogue.mockResolvedValue({ ok: true, entries: [GOLD_200] });
    setup({ bagQtyByKey: new Map([["stock:stock-1", 3]]) });

    expect(await screen.findByText("×3")).toBeInTheDocument();
  });

  it("BAG-2 (N6): shows 'hết' for a stock counted at 0 in the bag", async () => {
    listCatalogue.mockResolvedValue({ ok: true, entries: [GOLD_200] });
    setup({ bagQtyByKey: new Map([["stock:stock-1", 0]]) });

    expect(await screen.findByText("hết")).toBeInTheDocument();
  });
});
