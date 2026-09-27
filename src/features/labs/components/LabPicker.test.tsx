import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";
import type { ILabWithBranches } from "@/features/labs/core";
import { LabPicker } from "./LabPicker";

const searchLabsAction = vi.hoisted(() => vi.fn());
const listLabCitiesAction = vi.hoisted(() => vi.fn());

vi.mock("@/features/labs/actions", () => ({
  searchLabsAction: (...args: unknown[]) => searchLabsAction(...args),
  listLabCitiesAction: (...args: unknown[]) => listLabCitiesAction(...args),
}));

function makeLab(overrides: Partial<ILabWithBranches> = {}): ILabWithBranches {
  return {
    id: "lab-llab",
    ownerId: null,
    slug: "llab",
    name: "LLAB",
    address: null,
    linkUrl: null,
    services: ["C-41", "B&W"],
    acceptsMail: null,
    searchText: "llab",
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    branches: [
      {
        id: "branch-1",
        labId: "lab-llab",
        name: "Q.1",
        district: "Bến Nghé",
        areaHint: "Q.1",
        city: "TP.HCM",
        address: null,
        linkUrl: null,
        services: ["C-41", "B&W"],
        acceptsMail: null,
        searchText: "llab tp.hcm",
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    ...overrides,
  };
}

const homeDevelopment = makeLab({
  id: "lab-home",
  slug: "home-development",
  name: "Tự tráng ở nhà",
  services: ["B&W"],
  branches: [],
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("LabPicker", () => {
  it("shows the home-development lab first", async () => {
    listLabCitiesAction.mockResolvedValue(["TP.HCM"]);
    searchLabsAction.mockResolvedValue([homeDevelopment, makeLab()]);

    renderWithIntl(<LabPicker heading="Cuộn #14 · Gold 200" onPick={vi.fn()} onAddNew={vi.fn()} />);

    const names = await screen.findAllByText(/LLAB|Tự tráng ở nhà/);
    expect(names[0]).toHaveTextContent("Tự tráng ở nhà");
  });

  it("calls searchLabsAction with the picked city", async () => {
    const user = userEvent.setup();
    listLabCitiesAction.mockResolvedValue(["TP.HCM", "Đà Lạt"]);
    searchLabsAction.mockResolvedValue([makeLab()]);

    renderWithIntl(<LabPicker heading="Cuộn #14" onPick={vi.fn()} onAddNew={vi.fn()} />);
    await screen.findByText("LLAB");
    searchLabsAction.mockClear();

    await user.click(await screen.findByRole("button", { name: "TP.HCM" }));

    await waitFor(() =>
      expect(searchLabsAction).toHaveBeenCalledWith(expect.objectContaining({ city: "TP.HCM" })),
    );
  });

  it("debounces accent-free search input", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime });
    listLabCitiesAction.mockResolvedValue([]);
    searchLabsAction.mockResolvedValue([]);

    renderWithIntl(<LabPicker heading="Cuộn #14" onPick={vi.fn()} onAddNew={vi.fn()} />);
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    searchLabsAction.mockClear();

    const input = screen.getByLabelText("Tìm lab");
    await user.type(input, "da lat");

    expect(searchLabsAction).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    expect(searchLabsAction).toHaveBeenCalledWith(expect.objectContaining({ q: "da lat" }));
  });

  it("returns the lab and branch on the picked row's confirm button", async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    listLabCitiesAction.mockResolvedValue([]);
    searchLabsAction.mockResolvedValue([makeLab()]);

    renderWithIntl(<LabPicker heading="Cuộn #14" onPick={onPick} onAddNew={vi.fn()} />);

    await user.click(await screen.findByRole("radio"));
    await user.click(screen.getByRole("button", { name: "Chọn LLAB" }));

    expect(onPick).toHaveBeenCalledWith({ labId: "lab-llab", branchId: "branch-1" });
  });

  it("calls onAddNew from the not-found panel", async () => {
    const user = userEvent.setup();
    const onAddNew = vi.fn();
    listLabCitiesAction.mockResolvedValue([]);
    searchLabsAction.mockResolvedValue([]);

    renderWithIntl(<LabPicker heading="Cuộn #14" onPick={vi.fn()} onAddNew={onAddNew} />);

    await user.click(await screen.findByRole("button", { name: "+ Thêm lab mới" }));

    expect(onAddNew).toHaveBeenCalledTimes(1);
  });
});
