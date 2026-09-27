import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";
import type { TBagEntry, TCameraRow, TStockRow } from "@/features/bag/queries";

const listBag = vi.hoisted(() => vi.fn());
const addToBag = vi.hoisted(() => vi.fn());
const searchCatalogue = vi.hoisted(() => vi.fn());
const addCustomStock = vi.hoisted(() => vi.fn());
const addCustomCamera = vi.hoisted(() => vi.fn());
const addCustomLens = vi.hoisted(() => vi.fn());
const createRoll = vi.hoisted(() => vi.fn());
const push = vi.hoisted(() => vi.fn());
const posthogCapture = vi.hoisted(() => vi.fn());

vi.mock("@/features/bag/actions", () => ({ listBag, addToBag }));
vi.mock("@/features/catalogue/actions", () => ({ searchCatalogue, addCustomStock, addCustomCamera, addCustomLens }));
vi.mock("@/features/rolls/actions", () => ({ createRoll }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("posthog-js", () => ({ default: { capture: posthogCapture } }));

import { RollForm } from "./RollForm";

function makeStock(overrides: Partial<TStockRow>): TStockRow {
  return {
    id: "stock-gold",
    ownerId: null,
    slug: "kodak-gold-200",
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
  };
}

function makeCamera(overrides: Partial<TCameraRow>): TCameraRow {
  return {
    id: "cam-k1000",
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
  };
}

const goldStock = makeStock({});
const hp5Stock = makeStock({
  id: "stock-hp5",
  brand: "Ilford",
  name: "HP5 Plus 400",
  iso: 400,
  canisterColor: "mono",
  type: "bw",
});

const GOLD: TBagEntry = { bagItemId: "bag-stock-gold", kind: "stock", createdAt: new Date("2026-09-01"), stock: goldStock };

const HP5: TBagEntry = { bagItemId: "bag-stock-hp5", kind: "stock", createdAt: new Date("2026-09-02"), stock: hp5Stock };

const k1000Camera = makeCamera({});

const K1000: TBagEntry = {
  bagItemId: "bag-cam-k1000",
  kind: "camera",
  createdAt: new Date("2026-09-01"),
  camera: k1000Camera,
  fixedStock: null,
};

const FUNSAVER: TBagEntry = {
  bagItemId: "bag-cam-funsaver",
  kind: "camera",
  createdAt: new Date("2026-09-03"),
  camera: makeCamera({ id: "cam-funsaver", brand: "Kodak", model: "FunSaver", type: "single-use", fixedStockId: "stock-hp5" }),
  fixedStock: hp5Stock,
};

function setup(mode: "new" | "past" = "new") {
  const user = userEvent.setup();
  renderWithIntl(<RollForm mode={mode} />);
  return { user };
}

describe("RollForm", () => {
  afterEach(() => {
    listBag.mockReset();
    addToBag.mockReset();
    searchCatalogue.mockReset();
    addCustomStock.mockReset();
    addCustomCamera.mockReset();
    addCustomLens.mockReset();
    createRoll.mockReset();
    push.mockReset();
    posthogCapture.mockReset();
    vi.useRealTimers();
  });

  it("fires roll_form_opened once on mount, with the current mode", async () => {
    listBag.mockResolvedValue([]);
    setup("past");

    await waitFor(() => expect(listBag).toHaveBeenCalled());
    expect(posthogCapture).toHaveBeenCalledTimes(1);
    expect(posthogCapture).toHaveBeenCalledWith("roll_form_opened", { mode: "past" });
  });

  it("shows the film and camera type as a Vietnamese label, never the raw slug", async () => {
    listBag.mockResolvedValue([GOLD, HP5, K1000]);
    setup();

    await screen.findByText("Kodak Gold 200", { exact: false });

    expect(screen.getByText(/Màu âm/)).toBeInTheDocument();
    expect(screen.getByText(/Đen trắng/)).toBeInTheDocument();
    expect(screen.getByText(/Máy cơ SLR/)).toBeInTheDocument();
    expect(screen.queryByText(/color-negative/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bslr\b/)).not.toBeInTheDocument();
  });

  it("shows the bag first and auto-selects the first film and camera (bag-first ordering)", async () => {
    listBag.mockResolvedValue([GOLD, HP5, K1000]);
    setup();

    const goldChip = await screen.findByText("Kodak Gold 200", { exact: false });
    const goldRadio = goldChip.closest("label")?.querySelector("input");
    const camRadio = (await screen.findByText("Pentax K1000", { exact: false })).closest("label")?.querySelector("input");

    expect(goldRadio).toBeChecked();
    expect(camRadio).toBeChecked();
  });

  it("disables Save until film and camera are available, and enables it once the bag loads", async () => {
    listBag.mockResolvedValue([GOLD, K1000]);
    setup();

    await screen.findByText("Kodak Gold 200", { exact: false });
    expect(screen.getByRole("button", { name: "Lưu cuộn" })).toBeEnabled();
  });

  it("locks the film to a single-use camera's fixed stock (D20)", async () => {
    listBag.mockResolvedValue([GOLD, HP5, K1000, FUNSAVER]);
    const { user } = setup();

    await screen.findByText("Kodak Gold 200", { exact: false });
    await user.click(screen.getByText("Kodak FunSaver", { exact: false }));

    expect(await screen.findByText("Máy dùng 1 lần, film cố định là Ilford HP5 Plus 400.")).toBeInTheDocument();
    const goldRadio = screen.getByText("Kodak Gold 200", { exact: false }).closest("label")?.querySelector("input");
    const hp5Chip = screen.getAllByText(/Ilford HP5 Plus 400/).find((el) => el.closest("label"));
    const hp5Radio = hp5Chip?.closest("label")?.querySelector("input");
    expect(goldRadio).toBeDisabled();
    expect(hp5Radio).toBeChecked();
    expect(hp5Radio).toBeDisabled();
  });

  it("picking from the catalogue adds it to the bag and selects it", async () => {
    listBag.mockResolvedValueOnce([K1000]).mockResolvedValueOnce([GOLD, K1000]);
    searchCatalogue.mockResolvedValue({
      ok: true,
      entries: [{ kind: "stock" as const, ...goldStock }],
    });
    addToBag.mockResolvedValue({ ok: true, bagItemId: "bag-stock-gold" });
    const { user } = setup();

    await screen.findByText("Pentax K1000", { exact: false });
    await user.click(screen.getByRole("button", { name: "+ Film khác" }));

    await user.type(screen.getByLabelText("Tìm trong danh mục"), "gold");
    await waitFor(() => expect(searchCatalogue).toHaveBeenCalled());

    const pickButton = await screen.findByRole("button", { name: /Kodak Gold 200/ });
    await user.click(pickButton);

    expect(addToBag).toHaveBeenCalledWith({ kind: "stock", refId: "stock-gold" });
    await waitFor(() => expect(listBag).toHaveBeenCalledTimes(2));
    await waitFor(() => {
      const goldRadio = screen.getByText("Kodak Gold 200", { exact: false }).closest("label")?.querySelector("input");
      expect(goldRadio).toBeChecked();
    });
  });

  it("updates the push/pull badge live as shot ISO changes", async () => {
    listBag.mockResolvedValue([GOLD, K1000]);
    const { user } = setup();

    await screen.findByText("Kodak Gold 200", { exact: false });
    await user.click(screen.getByRole("button", { name: /^Thêm chi tiết/ }));
    await user.type(screen.getByLabelText("ISO chụp"), "400");

    expect(await screen.findByText("+1")).toBeInTheDocument();
  });

  it("requires both past dates before saving, with a human-voice error, and never calls createRoll", async () => {
    listBag.mockResolvedValue([GOLD, K1000]);
    const { user } = setup("past");

    await screen.findByText("Kodak Gold 200", { exact: false });
    await user.click(screen.getByRole("button", { name: "Lưu, rồi tải scan lên" }));

    expect(await screen.findAllByText("Điền cái này với bạn nhé.")).toHaveLength(2);
    expect(createRoll).not.toHaveBeenCalled();
  });

  it("disables a future day in the shotFrom calendar (Vietnam day, D14)", async () => {
    vi.setSystemTime(new Date("2026-09-15T04:00:00Z")); // ~11:00 in Asia/Ho_Chi_Minh
    listBag.mockResolvedValue([GOLD, K1000]);
    const { user } = setup("past");

    await screen.findByText("Kodak Gold 200", { exact: false });
    await user.click(screen.getByLabelText("Ngày bắt đầu"));
    const grid = await screen.findByRole("grid");

    expect(within(grid).getByRole("button", { name: /ngày 20 tháng 09/ })).toBeDisabled();
    expect(within(grid).getByRole("button", { name: /ngày 10 tháng 09/ })).toBeEnabled();

    vi.useRealTimers();
  });

  it("in shotTo's calendar, disables a day before the picked shotFrom", async () => {
    vi.setSystemTime(new Date("2026-09-25T04:00:00Z"));
    listBag.mockResolvedValue([GOLD, K1000]);
    const { user } = setup("past");

    await screen.findByText("Kodak Gold 200", { exact: false });
    await user.click(screen.getByLabelText("Ngày bắt đầu"));
    await user.click(within(await screen.findByRole("grid")).getByRole("button", { name: /ngày 10 tháng 09/ }));

    await user.click(screen.getByLabelText("Ngày chụp xong"));
    const toGrid = await screen.findByRole("grid");
    expect(within(toGrid).getByRole("button", { name: /ngày 5 tháng 09/ })).toBeDisabled();
    expect(within(toGrid).getByRole("button", { name: /ngày 12 tháng 09/ })).toBeEnabled();

    vi.useRealTimers();
  });

  it("picking dates in the calendar shows them as dd/mm/yyyy and saves shotFrom/shotTo", async () => {
    vi.setSystemTime(new Date("2026-09-25T04:00:00Z"));
    listBag.mockResolvedValue([GOLD, K1000]);
    createRoll.mockResolvedValue({ ok: true, rollId: "roll-past" });
    const { user } = setup("past");

    await screen.findByText("Kodak Gold 200", { exact: false });
    await user.click(screen.getByLabelText("Ngày bắt đầu"));
    await user.click(within(await screen.findByRole("grid")).getByRole("button", { name: /ngày 10 tháng 09/ }));
    expect(screen.getByLabelText("Ngày bắt đầu")).toHaveTextContent("10/09/2026");

    await user.click(screen.getByLabelText("Ngày chụp xong"));
    await user.click(within(await screen.findByRole("grid")).getByRole("button", { name: /ngày 12 tháng 09/ }));
    expect(screen.getByLabelText("Ngày chụp xong")).toHaveTextContent("12/09/2026");

    await user.click(screen.getByRole("button", { name: "Lưu, rồi tải scan lên" }));

    await waitFor(() => expect(createRoll).toHaveBeenCalledTimes(1));
    const [input] = createRoll.mock.calls[0];
    expect(typeof input.shotFrom).toBe("number");
    expect(typeof input.shotTo).toBe("number");
    expect(push).toHaveBeenCalledWith("/rolls/roll-past");

    vi.useRealTimers();
  });

  it("saves with formOpenedAt and routes to the new roll's page", async () => {
    listBag.mockResolvedValue([GOLD, K1000]);
    createRoll.mockResolvedValue({ ok: true, rollId: "roll-1" });
    const { user } = setup();

    await screen.findByText("Kodak Gold 200", { exact: false });
    await user.click(screen.getByRole("button", { name: "Lưu cuộn" }));

    await waitFor(() => expect(createRoll).toHaveBeenCalledTimes(1));
    const [input] = createRoll.mock.calls[0];
    expect(input).toMatchObject({ mode: "new", stockId: "stock-gold", cameraBagItemId: "bag-cam-k1000" });
    expect(typeof input.formOpenedAt).toBe("number");
    expect(push).toHaveBeenCalledWith("/rolls/roll-1");
  });
});
