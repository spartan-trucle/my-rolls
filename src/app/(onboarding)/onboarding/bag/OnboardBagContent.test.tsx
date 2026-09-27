import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";

const addToBag = vi.hoisted(() => vi.fn());
const removeFromBag = vi.hoisted(() => vi.fn());
const getBag = vi.hoisted(() => vi.fn());
const searchCatalogue = vi.hoisted(() => vi.fn());
const addCustomStock = vi.hoisted(() => vi.fn());
const addCustomCamera = vi.hoisted(() => vi.fn());
const addCustomLens = vi.hoisted(() => vi.fn());

vi.mock("@/features/bag/actions", () => ({ addToBag, removeFromBag, getBag }));
vi.mock("@/features/catalogue/actions", () => ({
  searchCatalogue,
  addCustomStock,
  addCustomCamera,
  addCustomLens,
}));

import { OnboardBagContent, type OnboardBagContentProps } from "./OnboardBagContent";

const K1000 = { kind: "camera" as const, id: "cam-1", brand: "Pentax", model: "K1000" };
const FM2 = { kind: "camera" as const, id: "cam-2", brand: "Nikon", model: "FM2" };
const GOLD_200 = { kind: "stock" as const, id: "stock-1", brand: "Kodak", name: "Gold 200", canisterColor: "gold" };

function setup(props: Partial<OnboardBagContentProps> = {}) {
  const user = userEvent.setup();
  renderWithIntl(
    <OnboardBagContent
      initialCameraChips={[K1000, FM2]}
      initialStockChips={[GOLD_200]}
      initialCheckedRefs={{}}
      {...props}
    />,
  );
  return { user };
}

describe("OnboardBagContent", () => {
  afterEach(() => {
    addToBag.mockReset();
    removeFromBag.mockReset();
    getBag.mockReset();
    searchCatalogue.mockReset();
    addCustomStock.mockReset();
    addCustomCamera.mockReset();
    addCustomLens.mockReset();
  });

  it("renders the curated chips, none checked when the bag is empty", () => {
    setup();

    expect(screen.getByRole("button", { name: "Pentax K1000" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Nikon FM2" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Kodak Gold 200" })).toHaveAttribute("aria-pressed", "false");
  });

  it("prefills a chip as checked when its ref is already in the bag", () => {
    setup({ initialCheckedRefs: { "camera:cam-1": "bag-item-1" } });

    expect(screen.getByRole("button", { name: "Pentax K1000" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Nikon FM2" })).toHaveAttribute("aria-pressed", "false");
  });

  it("toggling an unchecked chip adds it to the bag", async () => {
    addToBag.mockResolvedValue({ ok: true, bagItemId: "bag-item-1" });
    const { user } = setup();

    const chip = screen.getByRole("button", { name: "Pentax K1000" });
    await user.click(chip);

    expect(addToBag).toHaveBeenCalledWith({ kind: "camera", refId: "cam-1" });
    await waitFor(() => expect(chip).toHaveAttribute("aria-pressed", "true"));
  });

  it("toggling a checked chip removes it from the bag", async () => {
    removeFromBag.mockResolvedValue({ ok: true });
    const { user } = setup({ initialCheckedRefs: { "camera:cam-1": "bag-item-1" } });

    const chip = screen.getByRole("button", { name: "Pentax K1000" });
    await user.click(chip);

    expect(removeFromBag).toHaveBeenCalledWith({ bagItemId: "bag-item-1" });
    await waitFor(() => expect(chip).toHaveAttribute("aria-pressed", "false"));
  });

  it("reverts an add on error, back to unchecked", async () => {
    addToBag.mockResolvedValue({ ok: false, error: "not_found" });
    const { user } = setup();

    const chip = screen.getByRole("button", { name: "Pentax K1000" });
    await user.click(chip);

    expect(addToBag).toHaveBeenCalledWith({ kind: "camera", refId: "cam-1" });
    await waitFor(() => expect(chip).toHaveAttribute("aria-pressed", "false"));
  });

  it("reverts a remove on error, back to checked", async () => {
    removeFromBag.mockResolvedValue({ ok: false, error: "not_found" });
    const { user } = setup({ initialCheckedRefs: { "camera:cam-1": "bag-item-1" } });

    const chip = screen.getByRole("button", { name: "Pentax K1000" });
    await user.click(chip);

    expect(removeFromBag).toHaveBeenCalledWith({ bagItemId: "bag-item-1" });
    await waitFor(() => expect(chip).toHaveAttribute("aria-pressed", "true"));
  });

  it("typing in search adds matching results as extra chips", async () => {
    searchCatalogue.mockImplementation(async ({ kind }: { kind: "camera" | "stock" }) =>
      kind === "camera"
        ? { ok: true, entries: [{ kind: "camera", id: "cam-3", brand: "Canon", model: "AE-1" }] }
        : { ok: true, entries: [] },
    );
    const { user } = setup();

    await user.type(screen.getByLabelText("Tìm trong danh mục"), "canon");

    expect(await screen.findByRole("button", { name: "Canon AE-1" })).toBeInTheDocument();
  });

  it("clearing the search drops the extra results", async () => {
    searchCatalogue.mockImplementation(async ({ kind }: { kind: "camera" | "stock" }) =>
      kind === "camera"
        ? { ok: true, entries: [{ kind: "camera", id: "cam-3", brand: "Canon", model: "AE-1" }] }
        : { ok: true, entries: [] },
    );
    const { user } = setup();
    const searchField = screen.getByLabelText("Tìm trong danh mục");

    await user.type(searchField, "canon");
    await screen.findByRole("button", { name: "Canon AE-1" });

    await user.clear(searchField);

    await waitFor(() => expect(screen.queryByRole("button", { name: "Canon AE-1" })).not.toBeInTheDocument());
  });

  it("opens the custom entry dialog for the right kind and adds a checked chip", async () => {
    addCustomCamera.mockResolvedValue({ ok: true, refId: "cam-9", bagItemId: "bag-item-9" });
    getBag.mockResolvedValue({
      ok: true,
      entries: [
        {
          bagItemId: "bag-item-9",
          kind: "camera",
          createdAt: new Date(),
          camera: { id: "cam-9", brand: "Zenit", model: "12XP" },
          fixedStock: null,
        },
      ],
    });
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "+ Máy khác" }));

    expect(await screen.findByRole("heading", { name: "Thêm máy riêng" })).toBeInTheDocument();

    await user.type(screen.getByLabelText("Hãng"), "Zenit");
    await user.type(screen.getByLabelText("Tên máy"), "12XP");
    await user.click(screen.getByRole("button", { name: "Thêm máy vào túi" }));

    const chip = await screen.findByRole("button", { name: "Zenit 12XP" });
    expect(chip).toHaveAttribute("aria-pressed", "true");
  });
});
