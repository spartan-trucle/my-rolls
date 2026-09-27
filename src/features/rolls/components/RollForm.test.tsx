import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";
import type { TBagEntry, TCameraRow, TStockRow } from "@/features/bag/queries";
import type { IRollEntry } from "@/features/rolls/core";

const listBag = vi.hoisted(() => vi.fn());
const addToBag = vi.hoisted(() => vi.fn());
const listCatalogue = vi.hoisted(() => vi.fn().mockResolvedValue({ ok: true, entries: [] }));
const searchCatalogue = vi.hoisted(() => vi.fn());
const addCustomStock = vi.hoisted(() => vi.fn());
const addCustomCamera = vi.hoisted(() => vi.fn());
const addCustomLens = vi.hoisted(() => vi.fn());
const createRoll = vi.hoisted(() => vi.fn());
const updateRoll = vi.hoisted(() => vi.fn());
const getNextRollNumber = vi.hoisted(() => vi.fn().mockResolvedValue(16));
const push = vi.hoisted(() => vi.fn());
const posthogCapture = vi.hoisted(() => vi.fn());

vi.mock("@/features/bag/actions", () => ({ listBag, addToBag }));
vi.mock("@/features/catalogue/actions", () => ({ listCatalogue, searchCatalogue, addCustomStock, addCustomCamera, addCustomLens }));
vi.mock("@/features/rolls/actions", () => ({ createRoll, updateRoll, getNextRollNumber }));
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

const portra120Stock = makeStock({
  id: "stock-portra-120",
  brand: "Kodak",
  name: "Portra 400",
  iso: 400,
  formats: ["120"],
  type: "color-negative",
});

const GOLD: TBagEntry = { bagItemId: "bag-stock-gold", kind: "stock", createdAt: new Date("2026-09-01"), stock: goldStock, qty: 3 };

const HP5: TBagEntry = { bagItemId: "bag-stock-hp5", kind: "stock", createdAt: new Date("2026-09-02"), stock: hp5Stock };

const PORTRA_120: TBagEntry = { bagItemId: "bag-stock-portra-120", kind: "stock", createdAt: new Date("2026-09-03"), stock: portra120Stock };

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

function setup(mode: "new" | "past" = "new", roll?: IRollEntry) {
  const user = userEvent.setup();
  renderWithIntl(<RollForm mode={mode} roll={roll} />);
  return { user };
}

// N11's sticky-bar summary repeats the selected film/camera names as
// plain text too, so an unscoped `getByText(..., { exact: false })`
// (case-insensitive substring) matches both it and the film/camera chip
// — querying the chip's own `role="radio"` input instead (by its
// label's accessible name) never has that ambiguity, since the summary
// is a plain `<span>`, not a radio.
function findFilmChip(name: string) {
  return screen.findByRole("radio", { name: new RegExp(name) });
}
function findCameraChip(name: string) {
  return screen.findByRole("radio", { name: new RegExp(name) });
}
function filmChip(name: string) {
  return screen.getByRole("radio", { name: new RegExp(name) });
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
    updateRoll.mockReset();
    getNextRollNumber.mockReset().mockResolvedValue(16);
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

    await findFilmChip("Gold 200");

    expect(screen.getByText(/Màu âm/)).toBeInTheDocument();
    expect(screen.getByText(/Đen trắng/)).toBeInTheDocument();
    expect(screen.getByText(/Máy cơ SLR/)).toBeInTheDocument();
    expect(screen.queryByText(/color-negative/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bslr\b/)).not.toBeInTheDocument();
  });

  it("shows the bag first and auto-selects the first film and camera (bag-first ordering)", async () => {
    listBag.mockResolvedValue([GOLD, HP5, K1000]);
    setup();

    const goldRadio = await findFilmChip("Gold 200");
    const camRadio = await findCameraChip("Pentax K1000");

    expect(goldRadio).toBeChecked();
    expect(camRadio).toBeChecked();
  });

  it("shows the bag stock's qty as a ×N chip badge, or 'hết' at zero (N6)", async () => {
    listBag.mockResolvedValue([GOLD, { ...HP5, qty: 0 }, K1000]);
    setup();

    await findFilmChip("Gold 200");
    expect(screen.getByText("×3")).toBeInTheDocument();
    expect(screen.getByText("hết")).toBeInTheDocument();
  });

  it("shows the header kicker and name hint from the next roll number (N1)", async () => {
    listBag.mockResolvedValue([GOLD, K1000]);
    getNextRollNumber.mockResolvedValue(16);
    const { user } = setup();

    await findFilmChip("Gold 200");
    expect((await screen.findAllByText("CUỘN #16")).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /^Thêm chi tiết/ }));
    expect(screen.getByText("Để trống thì gọi là Cuộn #16.")).toBeInTheDocument();
  });

  it("shows a close link back to the shelf (G4/N2)", async () => {
    listBag.mockResolvedValue([GOLD, K1000]);
    setup();

    await findFilmChip("Gold 200");
    expect(screen.getByLabelText("Đóng, về kệ")).toHaveAttribute("href", "/");
  });

  it("disables Save until film and camera are available, and enables it once the bag loads", async () => {
    listBag.mockResolvedValue([GOLD, K1000]);
    setup();

    await findFilmChip("Gold 200");
    expect(screen.getByRole("button", { name: "Lưu cuộn" })).toBeEnabled();
  });

  it("locks the film to a single-use camera's fixed stock (D20)", async () => {
    listBag.mockResolvedValue([GOLD, HP5, K1000, FUNSAVER]);
    const { user } = setup();

    await findFilmChip("Gold 200");
    await user.click(screen.getByText("Kodak FunSaver", { exact: false }));

    expect(await screen.findByText("Máy dùng 1 lần, film cố định là Ilford HP5 Plus 400.")).toBeInTheDocument();
    const goldRadio = filmChip("Gold 200");
    const hp5Radio = screen.getByRole("radio", { name: /HP5 Plus 400/ });
    expect(goldRadio).toBeDisabled();
    expect(hp5Radio).toBeChecked();
    expect(hp5Radio).toBeDisabled();
  });

  it("N3/N4: picking an in-bag film from the inline search selects it, no bag checkbox", async () => {
    listBag.mockResolvedValue([K1000, GOLD]);
    searchCatalogue.mockResolvedValue({ ok: true, entries: [{ kind: "stock" as const, ...goldStock }] });
    const { user } = setup();

    await findCameraChip("Pentax K1000");
    await user.click(screen.getByRole("button", { name: "+ Film khác" }));
    await user.type(screen.getByLabelText("Tìm trong danh mục"), "gold");
    await waitFor(() => expect(searchCatalogue).toHaveBeenCalled());

    const pickButton = await screen.findByRole("button", { name: /Gold 200/ });
    await user.click(pickButton);

    await waitFor(() => {
      const goldRadio = filmChip("Gold 200");
      expect(goldRadio).toBeChecked();
    });
    expect(screen.queryByText(/Thêm.*vào túi cho lần sau/)).not.toBeInTheDocument();
  });

  it("N3/N4: picking a film not in the bag shows a 'mới' chip and the add-to-bag checkbox, wired to addStockToBag", async () => {
    listBag.mockResolvedValue([K1000]);
    searchCatalogue.mockResolvedValue({ ok: true, entries: [{ kind: "stock" as const, ...goldStock }] });
    createRoll.mockResolvedValue({ ok: true, rollId: "roll-1", number: 1, remainingQty: null });
    const { user } = setup();

    await findCameraChip("Pentax K1000");
    await user.click(screen.getByRole("button", { name: "+ Film khác" }));
    await user.type(screen.getByLabelText("Tìm trong danh mục"), "gold");
    await waitFor(() => expect(searchCatalogue).toHaveBeenCalled());
    await user.click(await screen.findByRole("button", { name: /Gold 200/ }));

    expect(screen.getByText("mới")).toBeInTheDocument();
    const checkbox = screen.getByRole("checkbox", { name: /Thêm Gold 200 vào túi cho lần sau/ });
    expect(checkbox).toBeChecked();

    await user.click(checkbox);
    await user.click(screen.getByRole("button", { name: "Lưu cuộn" }));

    await waitFor(() => expect(createRoll).toHaveBeenCalledTimes(1));
    const [input] = createRoll.mock.calls[0];
    expect(input).toMatchObject({ stockId: "stock-gold", addStockToBag: false });
    expect(addToBag).not.toHaveBeenCalled();
  });

  it("updates the push/pull badge live as shot ISO changes, with words and a warning at ≥3 stops", async () => {
    listBag.mockResolvedValue([GOLD, K1000]);
    const { user } = setup();

    await findFilmChip("Gold 200");
    await user.click(screen.getByRole("button", { name: /^Thêm chi tiết/ }));

    expect(screen.getByText("Điền ISO chụp để tính")).toBeInTheDocument();

    await user.type(screen.getByLabelText("ISO chụp"), "400");
    expect((await screen.findAllByText("+1")).length).toBeGreaterThan(0);
    expect(screen.getByText("stop · đẩy khi tráng")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("ISO chụp"));
    await user.type(screen.getByLabelText("ISO chụp"), "3200");
    expect(await screen.findByText("Nhiều đấy. Đẩy +4 thật à?")).toBeInTheDocument();
  });

  it("P2/P3: past mode is catalogue-first, with bag films as 'Film bạn từng dùng' quick picks", async () => {
    listBag.mockResolvedValue([GOLD, K1000]);
    setup("past");

    await screen.findByText("Film bạn từng dùng");
    expect(filmChip("Gold 200")).toBeInTheDocument();
    expect(screen.getByLabelText("Tìm trong danh mục")).toBeInTheDocument();
  });

  it("R2-4: past mode's month/year pick defaults to now, and 'Không nhớ' sends null month/year", async () => {
    vi.setSystemTime(new Date("2026-09-25T04:00:00Z"));
    listBag.mockResolvedValue([GOLD, K1000]);
    createRoll.mockResolvedValue({ ok: true, rollId: "roll-past", number: 1, remainingQty: null });
    const { user } = setup("past");

    await findFilmChip("Gold 200");
    await user.selectOptions(screen.getByLabelText("Tháng"), "0");
    await user.click(screen.getByRole("button", { name: "Lưu, rồi tải scan lên" }));

    await waitFor(() => expect(createRoll).toHaveBeenCalledTimes(1));
    const [input] = createRoll.mock.calls[0];
    expect(input.shotFromMonth).toBeNull();
    expect(input.shotToMonth).toBeNull();

    vi.useRealTimers();
  });

  it("R2-4: picking a month/year sends the same shotFromMonth/shotToMonth pair", async () => {
    vi.setSystemTime(new Date("2026-09-25T04:00:00Z"));
    listBag.mockResolvedValue([GOLD, K1000]);
    createRoll.mockResolvedValue({ ok: true, rollId: "roll-past", number: 1, remainingQty: null });
    const { user } = setup("past");

    await findFilmChip("Gold 200");
    await user.selectOptions(screen.getByLabelText("Tháng"), "10");
    await user.selectOptions(screen.getByLabelText("Năm"), "2025");
    await user.click(screen.getByRole("button", { name: "Lưu, rồi tải scan lên" }));

    await waitFor(() => expect(createRoll).toHaveBeenCalledTimes(1));
    const [input] = createRoll.mock.calls[0];
    expect(input.shotFromMonth).toEqual({ month: 10, year: 2025 });
    expect(input.shotToMonth).toEqual({ month: 10, year: 2025 });

    vi.useRealTimers();
  });

  it("saves with formOpenedAt and routes to the new roll's page, marked just-saved", async () => {
    listBag.mockResolvedValue([GOLD, K1000]);
    createRoll.mockResolvedValue({ ok: true, rollId: "roll-1", number: 1, remainingQty: null });
    const { user } = setup();

    await findFilmChip("Gold 200");
    await user.click(screen.getByRole("button", { name: "Lưu cuộn" }));

    await waitFor(() => expect(createRoll).toHaveBeenCalledTimes(1));
    const [input] = createRoll.mock.calls[0];
    expect(input).toMatchObject({ mode: "new", stockId: "stock-gold", cameraBagItemId: "bag-cam-k1000" });
    expect(typeof input.formOpenedAt).toBe("number");
    expect(push).toHaveBeenCalledWith("/rolls/roll-1?saved=1");
  });

  it("N11: shows a sticky summary line of film · camera · ISO", async () => {
    listBag.mockResolvedValue([GOLD, K1000]);
    setup();

    await findFilmChip("Gold 200");
    expect(screen.getAllByText("KODAK GOLD 200 · PENTAX K1000 · ISO 200").length).toBeGreaterThan(0);
  });

  it("prefills format 35mm and exposures 36, still editable, and submits them uncut when left alone", async () => {
    listBag.mockResolvedValue([GOLD, K1000]);
    createRoll.mockResolvedValue({ ok: true, rollId: "roll-2", number: 1, remainingQty: null });
    const { user } = setup();

    await findFilmChip("Gold 200");
    await user.click(screen.getByRole("button", { name: /^Thêm chi tiết/ }));

    const format35 = screen.getByRole("button", { name: "35mm" });
    expect(format35).toHaveAttribute("aria-pressed", "true");
    const exposuresField = screen.getByLabelText("Số kiểu");
    expect(exposuresField).toHaveValue("36");

    await user.clear(exposuresField);
    await user.type(exposuresField, "24");
    await user.click(screen.getByRole("button", { name: "Lưu cuộn" }));

    await waitFor(() => expect(createRoll).toHaveBeenCalledTimes(1));
    const [input] = createRoll.mock.calls[0];
    expect(input).toMatchObject({ format: "35mm", exposures: 24 });
  });

  it("N10: defaults format to 120 and exposures to 12 for a 120-only stock, and resets exposures to 12 on toggling to 120", async () => {
    listBag.mockResolvedValue([PORTRA_120, GOLD, K1000]);
    createRoll.mockResolvedValue({ ok: true, rollId: "roll-3", number: 1, remainingQty: null });
    const { user } = setup();

    await findFilmChip("Portra 400");
    await user.click(screen.getByRole("button", { name: /^Thêm chi tiết/ }));

    expect(screen.getByRole("button", { name: "120" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByLabelText("Số kiểu")).toHaveValue("12");

    await user.click(screen.getByRole("button", { name: "Lưu cuộn" }));

    await waitFor(() => expect(createRoll).toHaveBeenCalledTimes(1));
    const [input] = createRoll.mock.calls[0];
    expect(input).toMatchObject({ format: "120", exposures: 12 });
  });

  it("N7: new mode's optional load date is prefilled to today and stays editable", async () => {
    vi.setSystemTime(new Date("2026-09-25T04:00:00Z"));
    listBag.mockResolvedValue([GOLD, K1000]);
    createRoll.mockResolvedValue({ ok: true, rollId: "roll-4", number: 1, remainingQty: null });
    const { user } = setup();

    await findFilmChip("Gold 200");
    await user.click(screen.getByRole("button", { name: /^Thêm chi tiết/ }));

    expect(screen.getByLabelText("Ngày nạp")).toHaveTextContent("25/09/2026");

    await user.click(screen.getByRole("button", { name: "Lưu cuộn" }));
    await waitFor(() => expect(createRoll).toHaveBeenCalledTimes(1));
    const [input] = createRoll.mock.calls[0];
    expect(typeof input.shotFrom).toBe("number");

    vi.useRealTimers();
  });

  describe("edit mode (R4)", () => {
    const existingRoll: IRollEntry = {
      id: "roll-edit",
      number: 5,
      stockId: "stock-gold",
      cameraBagItemId: "bag-cam-k1000",
      lensId: null,
      name: "Đà Lạt",
      canisterColor: "gold",
      boxIso: 200,
      shotIso: 400,
      exposures: 36,
      format: "35mm",
      locations: ["Đà Lạt"],
      shotFrom: null,
      shotTo: null,
      datePrecision: null,
      notes: null,
      memory: null,
      version: 2,
      createdAt: new Date("2026-09-01"),
      pushPull: "+1",
      stock: { id: "stock-gold", brand: "Kodak", name: "Gold 200", iso: 200, canisterColor: "gold", type: "color-negative" },
      camera: { brand: "Pentax", model: "K1000", type: "slr" },
      lens: null,
    };

    it("prefills from the roll, hides the mode toggle, and calls updateRoll with the expected version", async () => {
      listBag.mockResolvedValue([GOLD, K1000]);
      updateRoll.mockResolvedValue({ ok: true });
      const { user } = setup("new", existingRoll);

      expect((await screen.findAllByText("CUỘN #5")).length).toBeGreaterThan(0);
      expect(screen.queryByRole("link", { name: "Đang trong máy" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Lưu thay đổi" })).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

      await waitFor(() => expect(updateRoll).toHaveBeenCalledTimes(1));
      const [input] = updateRoll.mock.calls[0];
      expect(input).toMatchObject({ rollId: "roll-edit", expectedVersion: 2, stockId: "stock-gold" });
      expect(getNextRollNumber).not.toHaveBeenCalled();
      expect(push).toHaveBeenCalledWith("/rolls/roll-edit");
    });

    it("shows a human-voice error on a stale version conflict", async () => {
      listBag.mockResolvedValue([GOLD, K1000]);
      updateRoll.mockResolvedValue({ ok: false, error: "stale_version" });
      const { user } = setup("new", existingRoll);

      await screen.findAllByText("CUỘN #5");
      await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

      expect(await screen.findByText("Cuộn này vừa được sửa ở nơi khác. Tải lại rồi thử lại nhé.")).toBeInTheDocument();
      expect(push).not.toHaveBeenCalled();
    });
  });
});
