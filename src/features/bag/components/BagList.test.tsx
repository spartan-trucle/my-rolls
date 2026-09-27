import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";
import type { TBagEntry } from "@/features/bag/queries";

const addToBag = vi.hoisted(() => vi.fn());
const removeFromBag = vi.hoisted(() => vi.fn());
const listBag = vi.hoisted(() => vi.fn());
const addCustomLens = vi.hoisted(() => vi.fn());
const searchCatalogue = vi.hoisted(() => vi.fn());

vi.mock("@/features/bag/actions", () => ({ addToBag, removeFromBag, listBag }));
vi.mock("@/features/catalogue/actions", () => ({
  searchCatalogue,
  addCustomStock: vi.fn(),
  addCustomCamera: vi.fn(),
  addCustomLens,
}));

import { BagList } from "./BagList";

function stockEntry(
  overrides: Partial<Extract<TBagEntry, { kind: "stock" }>["stock"]> = {},
): Extract<TBagEntry, { kind: "stock" }> {
  return {
    bagItemId: "bag-stock-1",
    kind: "stock",
    createdAt: new Date("2026-09-01"),
    stock: {
      id: "stock-1",
      ownerId: null,
      slug: "kodak-gold-200-200",
      brand: "Kodak",
      name: "Gold 200",
      iso: 200,
      formats: ["35mm"],
      type: "color-negative",
      canisterColor: "gold",
      canisterPhotoKey: null,
      status: "current",
      searchText: "kodak gold 200",
      deletedAt: null,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
      ...overrides,
    },
  };
}

function cameraEntry(
  overrides: Partial<Extract<TBagEntry, { kind: "camera" }>["camera"]> = {},
  fixedStock: Extract<TBagEntry, { kind: "camera" }>["fixedStock"] = null,
): Extract<TBagEntry, { kind: "camera" }> {
  return {
    bagItemId: "bag-cam-1",
    kind: "camera",
    createdAt: new Date("2026-09-02"),
    camera: {
      id: "cam-1",
      ownerId: null,
      slug: "pentax-k1000",
      brand: "Pentax",
      model: "K1000",
      type: "slr",
      format: "35mm",
      fixedStockId: null,
      status: "current",
      searchText: "pentax k1000",
      deletedAt: null,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
      ...overrides,
    },
    fixedStock,
  };
}

function lensEntry(
  overrides: Partial<Extract<TBagEntry, { kind: "lens" }>["lens"]> = {},
): Extract<TBagEntry, { kind: "lens" }> {
  return {
    bagItemId: "bag-lens-1",
    kind: "lens",
    createdAt: new Date("2026-09-03"),
    lens: {
      id: "lens-1",
      ownerId: "user-1",
      brand: "Pentax",
      model: "SMC Pentax-M 50mm f/1.7",
      focalLength: "50",
      deletedAt: null,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
      ...overrides,
    },
  };
}

function setup(entries: TBagEntry[]) {
  const user = userEvent.setup();
  renderWithIntl(<BagList initialEntries={entries} />);
  return { user };
}

describe("BagList", () => {
  afterEach(() => {
    addToBag.mockReset();
    removeFromBag.mockReset();
    listBag.mockReset();
    addCustomLens.mockReset();
    searchCatalogue.mockReset();
  });

  it("groups entries by kind, with a lens section (design finding 1)", () => {
    setup([stockEntry(), cameraEntry(), lensEntry()]);

    expect(screen.getByRole("heading", { name: "Film · 1 loại" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Máy ảnh · 1" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ống kính · 1" })).toBeInTheDocument();
    expect(screen.getByText("Kodak Gold 200")).toBeInTheDocument();
    expect(screen.getByText("Pentax K1000")).toBeInTheDocument();
    expect(screen.getByText("Pentax SMC Pentax-M 50mm f/1.7")).toBeInTheDocument();
  });

  it("shows the stock and camera type as Vietnamese labels, never the raw slug", () => {
    setup([stockEntry(), cameraEntry()]);

    expect(screen.getByText(/Màu âm/)).toBeInTheDocument();
    expect(screen.getByText(/Máy cơ SLR/)).toBeInTheDocument();
    expect(screen.queryByText(/color-negative/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bslr\b/)).not.toBeInTheDocument();
  });

  it("shows a custom entry's own stamp", () => {
    setup([stockEntry({ ownerId: "user-1", slug: null })]);

    expect(screen.getByText("Riêng")).toBeInTheDocument();
  });

  it("shows a single-use camera's fixed film (D20)", () => {
    const fixedStock = stockEntry().stock;
    setup([cameraEntry({ fixedStockId: fixedStock.id, type: "single-use" }, fixedStock)]);

    expect(screen.getByText("Film cố định: Kodak Gold 200")).toBeInTheDocument();
  });

  it("removes an item: calls removeFromBag and drops it from the list, with an undo toast", async () => {
    removeFromBag.mockResolvedValue({ ok: true });
    addToBag.mockResolvedValue({ ok: true, bagItemId: "bag-stock-2" });
    listBag.mockResolvedValue([stockEntry()]);
    const { user } = setup([stockEntry()]);

    await user.click(screen.getByRole("button", { name: "Bỏ Kodak Gold 200 khỏi túi" }));

    expect(removeFromBag).toHaveBeenCalledWith({ bagItemId: "bag-stock-1" });
    await waitFor(() => expect(screen.queryByText("Kodak Gold 200")).not.toBeInTheDocument());
    expect(screen.getByText("Đã bỏ Kodak Gold 200 khỏi túi.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hoàn tác" }));
    expect(addToBag).toHaveBeenCalledWith({ kind: "stock", refId: "stock-1" });
    await waitFor(() => expect(listBag).toHaveBeenCalled());
  });

  it("adds from the catalogue picker: opens it with bagRefIds, and updates the list once picked", async () => {
    searchCatalogue.mockResolvedValue({
      ok: true,
      entries: [{ kind: "stock", id: "stock-2", brand: "Fujifilm", name: "Superia 400", iso: 400, formats: ["35mm"], type: "color-negative", canisterColor: "green" }],
    });
    addToBag.mockResolvedValue({ ok: true, bagItemId: "bag-stock-2" });
    listBag.mockResolvedValue([stockEntry(), { ...stockEntry(), bagItemId: "bag-stock-2", stock: { ...stockEntry().stock, id: "stock-2", name: "Superia 400" } }]);
    const { user } = setup([stockEntry()]);

    await user.click(screen.getByRole("button", { name: "+ Thêm film từ danh mục" }));
    await user.type(screen.getByLabelText("Tìm trong danh mục"), "superia");

    await waitFor(() => expect(searchCatalogue).toHaveBeenCalledWith({ kind: "stock", q: "superia" }));
    await user.click(await screen.findByRole("button", { name: "Fujifilm Superia 400" }));

    await waitFor(() => expect(listBag).toHaveBeenCalled());
  });

  it("adds a custom lens: the lens section's add button opens CustomEntryForm directly, no picker (D3)", async () => {
    addCustomLens.mockResolvedValue({ ok: true, refId: "lens-2", bagItemId: "bag-lens-2" });
    listBag.mockResolvedValue([stockEntry(), lensEntry()]);
    const { user } = setup([stockEntry()]);

    await user.click(screen.getByRole("button", { name: "+ Thêm ống kính" }));

    expect(screen.getByRole("heading", { name: "Thêm ống kính" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Hãng"), "Pentax");
    await user.type(screen.getByLabelText("Tên ống kính"), "SMC Pentax-M 50mm f/1.7");
    await user.click(screen.getByRole("button", { name: "Thêm ống kính vào túi" }));

    expect(addCustomLens).toHaveBeenCalled();
    await waitFor(() => expect(listBag).toHaveBeenCalled());
  });

  it("shows an empty state pointing to adding the first camera and film", () => {
    setup([]);

    expect(screen.getByText("Túi trống trơn.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ Thêm máy" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ Thêm film" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Film/ })).not.toBeInTheDocument();
  });
});
