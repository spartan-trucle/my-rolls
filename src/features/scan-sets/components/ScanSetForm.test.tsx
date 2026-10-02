import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl as render } from "@/i18n/test-utils";
import type { IScanSetSummary } from "../core";

const updateScanSetAction = vi.hoisted(() => vi.fn());
vi.mock("../actions", () => ({ updateScanSetAction }));
vi.mock("@/features/labs/components/LabPicker", () => ({
  LabPicker: ({ onPick, onAddNew }: { onPick: (p: unknown) => void; onAddNew: () => void }) => (
    <div>
      <button type="button" onClick={() => onPick({ labId: "lab-home", branchId: null, name: "Tự tráng ở nhà", place: "" })}>
        pick home
      </button>
      <button type="button" onClick={() => onPick({ labId: "lab-llab", branchId: "br-q3", name: "LLAB", place: "Q.3, TP.HCM" })}>
        pick llab
      </button>
      <button type="button" onClick={onAddNew}>
        add new
      </button>
    </div>
  ),
}));
vi.mock("@/features/labs/components/LabAddForm", () => ({
  LabAddForm: ({ onCreated }: { onCreated: (r: unknown) => void }) => (
    <button type="button" onClick={() => onCreated({ lab: { id: "lab-mine", name: "Lab nhà Minh" }, branch: { id: "br-mine", city: "Đà Lạt", district: null, areaHint: null } })}>
      create lab
    </button>
  ),
}));

import { ScanSetForm } from "./ScanSetForm";

const blank: IScanSetSummary = {
  id: "set-1",
  labId: null,
  labBranchId: null,
  labName: null,
  branchName: null,
  branchCity: null,
  receivedAt: null,
  droppedAt: null,
  process: null,
  pushPullThirds: null,
  scanner: null,
  resolutionPx: null,
  fileFormat: null,
  priceVnd: null,
};

afterEach(() => vi.clearAllMocks());

const renderForm = (scanSet = blank, rollPushPullThirds: number | null = 3) => {
  const onSaved = vi.fn();
  render(<ScanSetForm scanSet={scanSet} rollLabel="Cuộn #16" rollPushPullThirds={rollPushPullThirds} onSaved={onSaved} today={new Date("2026-11-12T03:00:00Z")} />);
  return { onSaved };
};

describe("ScanSetForm (LAB-3, ScanSetForm board)", () => {
  it("defaults the received date to today and push/pull to the roll's", async () => {
    renderForm();
    expect(screen.getByLabelText(/Ngày nhận scan/)).toHaveValue("2026-11-12");
    await userEvent.click(screen.getByRole("button", { name: /Thêm chi tiết/ }));
    expect(screen.getByLabelText("Đẩy / kéo")).toHaveValue("+1");
  });

  it("folds the optional fields behind 'Thêm chi tiết'", async () => {
    renderForm();
    const toggle = screen.getByRole("button", { name: /Thêm chi tiết/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByLabelText("Máy scan")).not.toBeInTheDocument();
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("Máy scan")).toBeInTheDocument();
  });

  it("saves without a lab, so the roll page can ask later", async () => {
    updateScanSetAction.mockResolvedValue({ ok: true });
    const { onSaved } = renderForm();
    await userEvent.click(screen.getByRole("button", { name: "Lưu" }));
    expect(updateScanSetAction).toHaveBeenCalledWith(expect.objectContaining({ scanSetId: "set-1", labId: undefined }));
    expect(updateScanSetAction.mock.calls[0][0].receivedAt).toEqual(new Date("2026-11-12T00:00:00+07:00"));
    expect(onSaved).toHaveBeenCalled();
  });

  it("picks home development, which has no branch, and shows it on the lab row", async () => {
    updateScanSetAction.mockResolvedValue({ ok: true });
    renderForm();
    await userEvent.click(screen.getByRole("button", { name: /Chọn lab/ }));
    await userEvent.click(screen.getByRole("button", { name: "pick home" }));
    expect(screen.getByText("Tự tráng ở nhà")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Lưu" }));
    expect(updateScanSetAction).toHaveBeenCalledWith(expect.objectContaining({ labId: "lab-home", labBranchId: null }));
  });

  it("adds a new lab through LabAddForm and picks it (LAB-2)", async () => {
    renderForm();
    await userEvent.click(screen.getByRole("button", { name: /Chọn lab/ }));
    await userEvent.click(screen.getByRole("button", { name: "add new" }));
    await userEvent.click(screen.getByRole("button", { name: "create lab" }));
    expect(screen.getByText("Lab nhà Minh")).toBeInTheDocument();
  });

  it("sends the optional details it can read", async () => {
    updateScanSetAction.mockResolvedValue({ ok: true });
    renderForm();
    await userEvent.click(screen.getByRole("button", { name: /Thêm chi tiết/ }));
    await userEvent.click(screen.getByRole("radio", { name: "C-41" }));
    await userEvent.click(screen.getByRole("radio", { name: "Lớn" }));
    await userEvent.click(screen.getByRole("radio", { name: "JPEG" }));
    await userEvent.type(screen.getByLabelText("Giá"), "90.000");
    await userEvent.type(screen.getByLabelText("Máy scan"), "Noritsu HS-1800");
    await userEvent.click(screen.getByRole("button", { name: "Lưu" }));
    expect(updateScanSetAction).toHaveBeenCalledWith(
      expect.objectContaining({ process: "c41", resolutionPx: 4492, fileFormat: "JPEG", priceVnd: 90_000, scanner: "Noritsu HS-1800", pushPullThirds: 3 }),
    );
  });

  it("shows a save error in pin, in a human voice", async () => {
    updateScanSetAction.mockResolvedValue({ ok: false, error: "invalid_dates" });
    const { onSaved } = renderForm();
    await userEvent.click(screen.getByRole("button", { name: "Lưu" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Ngày gửi phải trước ngày nhận, và ngày nhận không ở tương lai.");
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("starts from what's already saved", () => {
    renderForm({ ...blank, labId: "lab-llab", labBranchId: "br-q3", labName: "LLAB", branchName: "Q.3", branchCity: "TP.HCM", receivedAt: new Date("2026-11-10T03:00:00Z") });
    expect(screen.getByText("LLAB")).toBeInTheDocument();
    expect(screen.getByLabelText(/Ngày nhận scan/)).toHaveValue("2026-11-10");
  });
});
