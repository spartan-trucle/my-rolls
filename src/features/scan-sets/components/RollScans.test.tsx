import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { renderWithIntl as render } from "@/i18n/test-utils";
import type { IScanSetSummary } from "../core";

const getScanSetForRollAction = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());
vi.mock("../actions", () => ({ getScanSetForRollAction, updateScanSetAction: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/features/uploads/components/RollUploadSection", () => ({
  RollUploadSection: ({ onOpenScanSet }: { onOpenScanSet?: () => void }) => (
    <button type="button" onClick={onOpenScanSet}>
      lab row
    </button>
  ),
}));
vi.mock("./ScanSetForm", () => ({
  ScanSetForm: ({ scanSet, onSaved }: { scanSet: IScanSetSummary; onSaved: () => void }) => (
    <div>
      <p>{`form for ${scanSet.id}`}</p>
      <button type="button" onClick={onSaved}>
        saved
      </button>
    </div>
  ),
}));

import { RollScans } from "./RollScans";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  };
});

const set = (patch: Partial<IScanSetSummary> = {}): IScanSetSummary => ({
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
  ...patch,
});

const props = { rollId: "r1", rollLabel: "Cuộn #16", frameCount: 36, rollPushPullThirds: null };

describe("RollScans", () => {
  it("asks for the lab when the scan set has none, and opens the form", async () => {
    getScanSetForRollAction.mockResolvedValue(set());
    render(<RollScans {...props} scanSet={set()} />);
    await userEvent.click(screen.getByRole("button", { name: /Chưa chọn lab/ }));
    expect(await screen.findByText("form for set-1")).toBeInTheDocument();
  });

  it("shows the lab, branch and received date once recorded", () => {
    render(
      <RollScans
        {...props}
        scanSet={set({ labId: "l", labName: "LLAB", branchName: "Q.3", receivedAt: new Date("2026-11-12T03:00:00Z") })}
      />,
    );
    expect(screen.getByRole("button", { name: /LLAB · Q\.3 · nhận 12\.11\.26/ })).toBeInTheDocument();
  });

  it("has no scan-set line before any upload", () => {
    render(<RollScans {...props} frameCount={0} scanSet={null} />);
    expect(screen.queryByRole("button", { name: /Chưa chọn lab/ })).not.toBeInTheDocument();
  });

  it("opens the form from the upload list's lab row, using the scan set the upload created", async () => {
    getScanSetForRollAction.mockResolvedValue(set({ id: "set-new" }));
    render(<RollScans {...props} frameCount={0} scanSet={null} />);
    await userEvent.click(screen.getByRole("button", { name: "lab row" }));
    expect(getScanSetForRollAction).toHaveBeenCalledWith("r1");
    expect(await screen.findByText("form for set-new")).toBeInTheDocument();
  });

  it("closes and refreshes the page after saving", async () => {
    getScanSetForRollAction.mockResolvedValue(set());
    render(<RollScans {...props} scanSet={set()} />);
    await userEvent.click(screen.getByRole("button", { name: /Chưa chọn lab/ }));
    await userEvent.click(await screen.findByRole("button", { name: "saved" }));
    expect(refresh).toHaveBeenCalled();
    expect(screen.queryByText("form for set-1")).not.toBeInTheDocument();
  });
});
