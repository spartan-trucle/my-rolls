import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";

const addCustomStock = vi.hoisted(() => vi.fn());
const addCustomCamera = vi.hoisted(() => vi.fn());
const addCustomLens = vi.hoisted(() => vi.fn());

vi.mock("@/features/catalogue/actions", () => ({ addCustomStock, addCustomCamera, addCustomLens }));

import { CustomEntryForm } from "./CustomEntryForm";

function setup(props: Partial<React.ComponentProps<typeof CustomEntryForm>> = {}) {
  const user = userEvent.setup();
  const onCreated = vi.fn();
  renderWithIntl(<CustomEntryForm onCreated={onCreated} {...props} />);
  return { user, onCreated };
}

describe("CustomEntryForm", () => {
  afterEach(() => {
    addCustomStock.mockReset();
    addCustomCamera.mockReset();
    addCustomLens.mockReset();
  });

  it("defaults to the stock section, prefilling the name from initialQuery", () => {
    setup({ initialQuery: "Aerocolor" });

    expect(screen.getByRole("heading", { name: "Thêm film riêng" })).toBeInTheDocument();
    expect(screen.getByLabelText("Tên film")).toHaveValue("Aerocolor");
  });

  it("rejects an empty brand and name in pin, without calling addCustomStock", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "Thêm film vào túi" }));

    expect(screen.getAllByText("Điền cái này với bạn nhé.")).toHaveLength(2);
    expect(addCustomStock).not.toHaveBeenCalled();
  });

  it("submits a custom stock with the picked canister colour and formats", async () => {
    addCustomStock.mockResolvedValue({ ok: true, refId: "stock-1", bagItemId: "bag-1" });
    const { user, onCreated } = setup();

    await user.type(screen.getByLabelText("Hãng hoặc nơi chiết"), "Tự chiết");
    await user.type(screen.getByLabelText("Tên film"), "Vision3 250D chiết");
    await user.type(screen.getByLabelText("ISO hộp"), "250");
    await user.click(screen.getByText("Cine, lạ"));
    await user.click(screen.getByText("120"));

    await user.click(screen.getByRole("button", { name: "Thêm film vào túi" }));

    await waitFor(() =>
      expect(addCustomStock).toHaveBeenCalledWith({
        brand: "Tự chiết",
        name: "Vision3 250D chiết",
        iso: 250,
        formats: ["35mm", "120"],
        canisterColor: "rose",
        qty: 0,
      }),
    );
    expect(onCreated).toHaveBeenCalledWith({ kind: "stock", refId: "stock-1", bagItemId: "bag-1" });
  });

  it("switches to the camera section and submits with its format", async () => {
    addCustomCamera.mockResolvedValue({ ok: true, refId: "cam-1", bagItemId: "bag-2" });
    const { user, onCreated } = setup();

    await user.click(screen.getByRole("button", { name: "Máy ảnh" }));
    expect(screen.getByRole("heading", { name: "Thêm máy riêng" })).toBeInTheDocument();

    await user.type(screen.getByLabelText("Hãng"), "Konica");
    await user.type(screen.getByLabelText("Tên máy"), "Big Mini BM-201");

    await user.click(screen.getByRole("button", { name: "Thêm máy vào túi" }));

    await waitFor(() =>
      expect(addCustomCamera).toHaveBeenCalledWith({ brand: "Konica", model: "Big Mini BM-201", format: "35mm" }),
    );
    expect(onCreated).toHaveBeenCalledWith({ kind: "camera", refId: "cam-1", bagItemId: "bag-2" });
  });

  it("switches to the lens section and submits", async () => {
    addCustomLens.mockResolvedValue({ ok: true, refId: "lens-1", bagItemId: "bag-3" });
    const { user, onCreated } = setup();

    await user.click(screen.getByRole("button", { name: "Ống kính" }));
    expect(screen.getByRole("heading", { name: "Thêm ống kính" })).toBeInTheDocument();

    await user.type(screen.getByLabelText("Hãng"), "Pentax");
    await user.type(screen.getByLabelText("Tên ống kính"), "SMC Pentax-M 50mm f/1.7");
    await user.type(screen.getByLabelText("Tiêu cự (mm)"), "50");

    await user.click(screen.getByRole("button", { name: "Thêm ống kính vào túi" }));

    await waitFor(() =>
      expect(addCustomLens).toHaveBeenCalledWith({ brand: "Pentax", model: "SMC Pentax-M 50mm f/1.7", focalLength: "50" }),
    );
    expect(onCreated).toHaveBeenCalledWith({ kind: "lens", refId: "lens-1", bagItemId: "bag-3" });
  });

  it("shows a generic error and doesn't call onCreated when the save fails", async () => {
    addCustomStock.mockResolvedValue({ ok: false, error: "validation" });
    const { user, onCreated } = setup();

    await user.type(screen.getByLabelText("Hãng hoặc nơi chiết"), "Tự chiết");
    await user.type(screen.getByLabelText("Tên film"), "Vision3 250D chiết");
    await user.click(screen.getByRole("button", { name: "Thêm film vào túi" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Có gì đó không ổn. Thử lại nhé.");
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("BAG-2 (E2): steps 'Đang có' and submits it as qty", async () => {
    addCustomStock.mockResolvedValue({ ok: true, refId: "stock-1", bagItemId: "bag-1" });
    const { user } = setup();

    await user.type(screen.getByLabelText("Hãng hoặc nơi chiết"), "Tự chiết");
    await user.type(screen.getByLabelText("Tên film"), "Vision3 250D chiết");
    await user.click(screen.getByRole("button", { name: "Tăng số cuộn đang có" }));
    await user.click(screen.getByRole("button", { name: "Tăng số cuộn đang có" }));

    await user.click(screen.getByRole("button", { name: "Thêm film vào túi" }));

    await waitFor(() => expect(addCustomStock).toHaveBeenCalledWith(expect.objectContaining({ qty: 2 })));
  });

  it("E1: shows a live canister preview scribble for the stock section", () => {
    setup();

    expect(screen.getByText("vỏ cuộn của bạn")).toBeInTheDocument();
  });

  it("E5: shows '‹ Quay lại' instead of the close ✕ when onBack is given", async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(<CustomEntryForm onCreated={vi.fn()} onClose={vi.fn()} onBack={onBack} />);

    const back = screen.getByRole("button", { name: "‹ Quay lại" });
    expect(screen.queryByRole("button", { name: "Đóng" })).not.toBeInTheDocument();

    await user.click(back);
    expect(onBack).toHaveBeenCalled();
  });
});
