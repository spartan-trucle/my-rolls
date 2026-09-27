import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";

const searchCatalogue = vi.hoisted(() => vi.fn());
const addToBag = vi.hoisted(() => vi.fn());

vi.mock("@/features/catalogue/actions", () => ({ searchCatalogue }));
vi.mock("@/features/bag/actions", () => ({ addToBag }));

import { CataloguePicker } from "./CataloguePicker";

const GOLD_200 = {
  kind: "stock" as const,
  id: "stock-1",
  brand: "Kodak",
  name: "Gold 200",
  iso: 200,
  formats: ["35mm"],
  type: "MÀU",
  canisterColor: "gold",
};

const K1000 = {
  kind: "camera" as const,
  id: "cam-1",
  brand: "Pentax",
  model: "K1000",
  type: "SLR",
  format: "35mm",
};

function setup() {
  const user = userEvent.setup();
  const onPicked = vi.fn();
  const onAddCustom = vi.fn();
  renderWithIntl(<CataloguePicker onPicked={onPicked} onAddCustom={onAddCustom} />);
  return { user, onPicked, onAddCustom };
}

describe("CataloguePicker", () => {
  afterEach(() => {
    searchCatalogue.mockReset();
    addToBag.mockReset();
  });

  it("shows a hint and doesn't search until something is typed", () => {
    setup();

    expect(screen.getByText("Gõ tên film hoặc máy để tìm trong danh mục.")).toBeInTheDocument();
    expect(searchCatalogue).not.toHaveBeenCalled();
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
  });

  it("shows the no-match state and opens the custom form prefilled with the typed text", async () => {
    searchCatalogue.mockResolvedValue({ ok: true, entries: [] });
    const { user, onAddCustom } = setup();

    await user.type(screen.getByLabelText("Tìm trong danh mục"), "aerocolor");

    expect(await screen.findByText("Danh mục chưa có “aerocolor”.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "+ Thêm film riêng" }));
    expect(onAddCustom).toHaveBeenCalledWith("stock", "aerocolor");
  });

  it("clears the search from the no-match state", async () => {
    searchCatalogue.mockResolvedValue({ ok: true, entries: [] });
    const { user } = setup();

    const input = screen.getByLabelText("Tìm trong danh mục");
    await user.type(input, "aerocolor");
    await screen.findByText("Danh mục chưa có “aerocolor”.");

    await user.click(screen.getByRole("button", { name: "Xoá ô tìm, xem cả danh mục" }));

    await waitFor(() => expect(input).toHaveValue(""));
    expect(await screen.findByText("Gõ tên film hoặc máy để tìm trong danh mục.")).toBeInTheDocument();
  });
});
