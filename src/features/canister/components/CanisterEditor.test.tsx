import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { IRollEntry } from "@/features/rolls/core";
import { renderWithIntl } from "@/i18n/test-utils";
import { CanisterEditor, pickerColor } from "./CanisterEditor";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));

function makeRollEntry(overrides: Partial<IRollEntry>): IRollEntry {
  return {
    id: "r1",
    number: 14,
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
    stock: { id: "s", brand: "Kodak", name: "Gold 200", iso: 200, canisterColor: "gold", type: "color-negative" },
    camera: null,
    lens: null,
    ...overrides,
  };
}

const roll = makeRollEntry({});
const ok = () => vi.fn().mockResolvedValue({ ok: true as const });

async function openEditor() {
  await userEvent.click(screen.getByRole("button", { name: /Đổi vỏ cuộn/ }));
}

describe("CanisterEditor (CAN-2)", () => {
  it("picks a preset, previews it live, and saves a drawn canister", async () => {
    const save = ok();
    renderWithIntl(<CanisterEditor roll={roll} save={save} />);
    await openEditor();
    await userEvent.click(screen.getByRole("radio", { name: "Kem" }));
    expect(screen.getByTestId("canister-preview").getAttribute("style")).toContain("var(--stock-cream)");
    expect(screen.getByRole("radio", { name: "Tự vẽ" })).toBeChecked();
    await userEvent.click(screen.getByRole("button", { name: "Lưu" }));
    expect(save).toHaveBeenCalledWith({ rollId: "r1", style: "drawn", color: "cream" });
  });

  it("sends a picker colour lowercased", async () => {
    const save = ok();
    renderWithIntl(<CanisterEditor roll={roll} save={save} />);
    await openEditor();
    fireEvent.input(screen.getByLabelText("Chọn màu khác"), { target: { value: "#A1B2C3" } });
    expect(screen.getByRole("radio", { name: "Màu khác" })).toBeChecked();
    expect(screen.getByText("#A1B2C3")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Lưu" }));
    expect(save).toHaveBeenCalledWith({ rollId: "r1", style: "drawn", color: "#a1b2c3" });
  });

  it("R13: only a #rrggbb picker value becomes a draft colour", () => {
    expect(pickerColor("#A1B2C3")).toBe("#a1b2c3");
    expect(pickerColor("red")).toBeNull();
    expect(pickerColor("#abc")).toBeNull();
    expect(pickerColor("url(x)")).toBeNull();
  });

  it("offers the real canister photo only when the stock has one", async () => {
    renderWithIntl(<CanisterEditor roll={roll} save={vi.fn()} />);
    await openEditor();
    expect(screen.getByRole("radio", { name: "Theo màu film" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Tự vẽ" })).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "Ảnh vỏ thật" })).toBeNull();
  });

  it("saves the catalogue photo look when the stock has a photo", async () => {
    const save = ok();
    const withPhoto = makeRollEntry({ stock: { ...roll.stock!, canisterPhotoUrl: "https://cdn.example/gold.jpg" } });
    renderWithIntl(<CanisterEditor roll={withPhoto} save={save} />);
    await openEditor();
    await userEvent.click(screen.getByRole("radio", { name: "Ảnh vỏ thật" }));
    await userEvent.click(screen.getByRole("button", { name: "Lưu" }));
    expect(save).toHaveBeenCalledWith({ rollId: "r1", style: "photo" });
  });

  it("resets to the film's colour", async () => {
    const save = ok();
    renderWithIntl(<CanisterEditor roll={{ ...roll, canisterStyle: "drawn", canisterColor: "#123456" }} save={save} />);
    await openEditor();
    expect(screen.getByRole("radio", { name: "Màu khác" })).toBeChecked();
    await userEvent.click(screen.getByRole("radio", { name: "Theo màu film" }));
    await userEvent.click(screen.getByRole("button", { name: "Lưu" }));
    expect(save).toHaveBeenCalledWith({ rollId: "r1", style: "stock" });
  });

  it("keeps the sheet open and says so when saving fails", async () => {
    const save = vi.fn().mockResolvedValue({ ok: false, error: "not_found" });
    renderWithIntl(<CanisterEditor roll={roll} save={save} />);
    await openEditor();
    await userEvent.click(screen.getByRole("radio", { name: "Đỏ" }));
    await userEvent.click(screen.getByRole("button", { name: "Lưu" }));
    expect(await screen.findByText("Chưa lưu được, thử lại nhé")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveAttribute("open");
  });

  it("recovers when the save throws: says so, re-enables the buttons and stays open", async () => {
    const save = vi.fn().mockRejectedValue(new Error("network"));
    renderWithIntl(<CanisterEditor roll={roll} save={save} />);
    await openEditor();
    await userEvent.click(screen.getByRole("radio", { name: "Đỏ" }));
    await userEvent.click(screen.getByRole("button", { name: "Lưu" }));
    expect(await screen.findByText("Chưa lưu được, thử lại nhé")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lưu" })).toBeEnabled();
    expect(screen.getByText("Huỷ").closest("button")).toBeEnabled();
    expect(screen.getByRole("dialog")).toHaveAttribute("open");
  });

  it("keeps the footer outside the scrolling body, so Lưu stays in view", async () => {
    renderWithIntl(<CanisterEditor roll={roll} save={ok()} />);
    await openEditor();
    const body = screen.getByTestId("canister-editor-body");
    expect(body).toContainElement(screen.getByRole("radio", { name: "Kem" }));
    expect(body).not.toContainElement(screen.getByRole("button", { name: "Lưu" }));
  });

  it("closes and refreshes the page after a save", async () => {
    refresh.mockClear();
    renderWithIntl(<CanisterEditor roll={roll} save={ok()} />);
    await openEditor();
    await userEvent.click(screen.getByRole("radio", { name: "Xanh lá" }));
    await userEvent.click(screen.getByRole("button", { name: "Lưu" }));
    await waitFor(() => expect(screen.getByRole("dialog", { hidden: true })).not.toHaveAttribute("open"));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("R14: disables Lưu while a save is in flight", async () => {
    let resolve: (value: { ok: true }) => void = () => {};
    const save = vi.fn().mockReturnValue(new Promise((r) => (resolve = r)));
    renderWithIntl(<CanisterEditor roll={roll} save={save} />);
    await openEditor();
    await userEvent.click(screen.getByRole("radio", { name: "Hồng" }));
    await userEvent.click(screen.getByRole("button", { name: "Lưu" }));
    expect(screen.getByRole("button", { name: "Lưu" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Lưu" }));
    expect(save).toHaveBeenCalledTimes(1);
    resolve({ ok: true });
    await waitFor(() => expect(screen.getByRole("dialog", { hidden: true })).not.toHaveAttribute("open"));
  });

  it("R14: starts from the roll's saved look each time it opens, and returns focus to the trigger", async () => {
    renderWithIntl(<CanisterEditor roll={roll} save={ok()} />);
    await openEditor();
    await userEvent.click(screen.getByRole("radio", { name: "Đỏ" }));
    await userEvent.click(screen.getByRole("button", { name: "Đóng" }));
    expect(screen.getByRole("button", { name: /Đổi vỏ cuộn/ })).toHaveFocus();
    await openEditor();
    expect(screen.getByRole("radio", { name: "Đỏ" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Theo màu film" })).toBeChecked();
  });

  it("closes on Esc", async () => {
    renderWithIntl(<CanisterEditor roll={roll} save={ok()} />);
    await openEditor();
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
    expect(screen.getByRole("dialog", { hidden: true })).not.toHaveAttribute("open");
    expect(screen.getByRole("button", { name: /Đổi vỏ cuộn/ })).toHaveFocus();
  });

  it("moves between swatches with the arrow keys", async () => {
    const user = userEvent.setup();
    renderWithIntl(<CanisterEditor roll={{ ...roll, canisterStyle: "drawn", canisterColor: "gold" }} save={ok()} />);
    await user.click(screen.getByRole("button", { name: /Đổi vỏ cuộn/ }));
    const gold = screen.getByRole("radio", { name: "Vàng" });
    expect(gold).toBeChecked();
    gold.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Xanh lá" })).toBeChecked();
  });

  it("links 'Đổi tên' to the roll's edit page (R12)", async () => {
    renderWithIntl(<CanisterEditor roll={roll} save={ok()} />);
    await openEditor();
    expect(screen.getByRole("link", { name: "Đổi tên" })).toHaveAttribute("href", "/rolls/r1/edit");
  });
});
