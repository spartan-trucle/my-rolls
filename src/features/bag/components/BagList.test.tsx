import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";
import type { TBagEntry } from "@/features/bag/queries";

const addToBag = vi.hoisted(() => vi.fn());
const removeFromBag = vi.hoisted(() => vi.fn());
const listBag = vi.hoisted(() => vi.fn());
const setStockQty = vi.hoisted(() => vi.fn());
const setStockExpiryYear = vi.hoisted(() => vi.fn());
const addCustomLens = vi.hoisted(() => vi.fn());
const searchCatalogue = vi.hoisted(() => vi.fn());
const listCatalogue = vi.hoisted(() => vi.fn());

vi.mock("@/features/bag/actions", () => ({ addToBag, removeFromBag, listBag, setStockQty, setStockExpiryYear }));
vi.mock("@/features/catalogue/actions", () => ({
  searchCatalogue,
  listCatalogue,
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
  beforeEach(() => {
    listCatalogue.mockResolvedValue({ ok: true, entries: [] });
  });

  afterEach(() => {
    addToBag.mockReset();
    removeFromBag.mockReset();
    listBag.mockReset();
    setStockQty.mockReset();
    setStockExpiryYear.mockReset();
    addCustomLens.mockReset();
    searchCatalogue.mockReset();
    listCatalogue.mockReset();
  });

  it("groups entries by kind, with a lens section (design finding 1)", () => {
    setup([stockEntry(), cameraEntry(), lensEntry()]);

    expect(screen.getByRole("heading", { name: "Film · 1 loại · 0 cuộn" })).toBeInTheDocument();
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

  it("opens a confirm dialog naming the item; cancel does nothing", async () => {
    const { user } = setup([cameraEntry()]);

    await user.click(screen.getByRole("button", { name: "Bỏ Pentax K1000 khỏi túi" }));

    expect(await screen.findByRole("heading", { name: "Bỏ Pentax K1000 khỏi túi?" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Huỷ" }));

    expect(removeFromBag).not.toHaveBeenCalled();
    expect(screen.queryByRole("heading", { name: "Bỏ Pentax K1000 khỏi túi?" })).not.toBeInTheDocument();
    expect(screen.getByText("Pentax K1000")).toBeInTheDocument();
  });

  it("confirming the dialog calls removeFromBag and drops the item from the list", async () => {
    removeFromBag.mockResolvedValue({ ok: true });
    const { user } = setup([cameraEntry()]);

    await user.click(screen.getByRole("button", { name: "Bỏ Pentax K1000 khỏi túi" }));
    await screen.findByRole("heading", { name: "Bỏ Pentax K1000 khỏi túi?" });

    await user.click(screen.getByRole("button", { name: "Xoá khỏi túi" }));

    expect(removeFromBag).toHaveBeenCalledWith({ bagItemId: "bag-cam-1" });
    await waitFor(() => expect(screen.queryByText("Pentax K1000")).not.toBeInTheDocument());
    expect(screen.queryByRole("heading", { name: "Bỏ Pentax K1000 khỏi túi?" })).not.toBeInTheDocument();
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
    await user.click(await screen.findByRole("button", { name: "Superia 400" }));

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

  it("BAG-2: shows the counts line, the canister strip, and per-item roll counts", () => {
    setup([
      stockEntry({ id: "stock-1" }), // qty undefined → not counted, no strip canister
      { ...stockEntry(), bagItemId: "bag-stock-2", qty: 2, stock: { ...stockEntry().stock, id: "stock-2" } },
      { ...cameraEntry(), rollsShot: 3 },
      { ...lensEntry(), rollsShot: 1 },
    ]);

    expect(screen.getByText("2 cuộn chưa chụp · 2 loại film · 1 máy · 1 ống kính")).toBeInTheDocument();
    // one canister per unloaded roll (2), drawn from the counted stock only
    const strip = screen.getByRole("list", { name: "2 cuộn chờ nạp" });
    expect(strip.querySelectorAll("li")).toHaveLength(2);
    expect(screen.getByText("3 cuộn")).toBeInTheDocument(); // camera BAG-3
    expect(screen.getByText("1 cuộn")).toBeInTheDocument(); // lens
    expect(screen.getAllByText("Chưa chụp cuộn nào")).toHaveLength(2); // neither stock has any rolls shot
  });

  it("BAG-2 (owner 28.09.2026): the row has an edit button, no inline −/+; the dialog saves the new count", async () => {
    setStockQty.mockResolvedValue({ ok: true, qty: 3 });
    const { user } = setup([{ ...stockEntry(), qty: 1 }]);

    expect(screen.queryByRole("button", { name: /Tăng số cuộn/ })).toBeNull();
    expect(screen.getByText("×1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sửa số cuộn Kodak Gold 200" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Tăng số cuộn Kodak Gold 200" }));
    await user.click(within(dialog).getByRole("button", { name: "Tăng số cuộn Kodak Gold 200" }));
    expect(setStockQty).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Lưu" }));

    expect(setStockQty).toHaveBeenCalledWith({ bagItemId: "bag-stock-1", qty: 3 });
    await waitFor(() => expect(screen.getByText("×3")).toBeInTheDocument());
  });

  it("BAG-2 (owner 28.09.2026): saving a count of 0 takes the film off the list", async () => {
    setStockQty.mockResolvedValue({ ok: true, qty: 0 });
    const { user } = setup([{ ...stockEntry(), qty: 1 }, cameraEntry()]);

    await user.click(screen.getByRole("button", { name: "Sửa số cuộn Kodak Gold 200" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Giảm số cuộn Kodak Gold 200" }));
    expect(within(dialog).getByText("Về 0 là film rời khỏi túi.")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Lưu" }));

    expect(setStockQty).toHaveBeenCalledWith({ bagItemId: "bag-stock-1", qty: 0 });
    await waitFor(() => expect(screen.queryByText("Kodak Gold 200")).toBeNull());
  });

  it("BAG-2 (owner 28.09.2026): a film row has no × — removing it lives in the count dialog", async () => {
    removeFromBag.mockResolvedValue({ ok: true });
    const { user } = setup([{ ...stockEntry(), qty: 2 }, cameraEntry()]);

    expect(screen.queryByRole("button", { name: "Bỏ Kodak Gold 200 khỏi túi" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Sửa số cuộn Kodak Gold 200" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Xoá khỏi túi" }));

    expect(removeFromBag).toHaveBeenCalledWith({ bagItemId: "bag-stock-1" });
    expect(setStockQty).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByText("Kodak Gold 200")).toBeNull());
    expect(screen.getByText("Pentax K1000")).toBeInTheDocument();
  });
});
