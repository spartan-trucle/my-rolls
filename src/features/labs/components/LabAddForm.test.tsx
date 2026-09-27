import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";
import { LabAddForm } from "./LabAddForm";

const addLabAction = vi.hoisted(() => vi.fn());

vi.mock("@/features/labs/actions", () => ({
  addLabAction: (...args: unknown[]) => addLabAction(...args),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("LabAddForm", () => {
  it("requires a name before submitting", async () => {
    const user = userEvent.setup();
    addLabAction.mockResolvedValue({
      ok: false,
      error: { type: "validation", issues: [{ path: "name", message: "name_required" }] },
    });

    renderWithIntl(<LabAddForm onCreated={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Lưu lab" }));

    await waitFor(() =>
      expect(screen.getByText("Đặt tên cho lab này với bạn nhé.")).toBeInTheDocument(),
    );
  });

  it("shows a human-voice error for an invalid link", async () => {
    const user = userEvent.setup();
    addLabAction.mockResolvedValue({
      ok: false,
      error: { type: "validation", issues: [{ path: "linkUrl", message: "invalid_link_url" }] },
    });

    renderWithIntl(<LabAddForm onCreated={vi.fn()} />);
    await user.type(screen.getByLabelText("Tên lab"), "Lab gần nhà");
    await user.type(screen.getByLabelText("Link Facebook hoặc Google Maps"), "not-a-link");
    await user.click(screen.getByRole("button", { name: "Lưu lab" }));

    await waitFor(() =>
      expect(
        screen.getByText("Link này chưa đúng định dạng — thử dán lại xem sao."),
      ).toBeInTheDocument(),
    );
  });

  it("toggles service chips with aria-pressed", async () => {
    const user = userEvent.setup();
    renderWithIntl(<LabAddForm onCreated={vi.fn()} />);

    const c41 = screen.getByRole("button", { name: "C-41" });
    expect(c41).toHaveAttribute("aria-pressed", "false");

    await user.click(c41);
    expect(c41).toHaveAttribute("aria-pressed", "true");
  });

  it("submits name, city and picked services, then calls onCreated", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    const lab = { id: "lab-1" };
    const branch = { id: "branch-1" };
    addLabAction.mockResolvedValue({ ok: true, lab, branch });

    renderWithIntl(<LabAddForm onCreated={onCreated} />);
    await user.type(screen.getByLabelText("Tên lab"), "Lab gần nhà mình");
    await user.click(screen.getByRole("button", { name: "Đà Lạt" }));
    await user.click(screen.getByRole("button", { name: "C-41" }));
    await user.click(screen.getByRole("button", { name: "Lưu lab" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith({ lab, branch }));
    expect(addLabAction).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Lab gần nhà mình", city: "Đà Lạt", services: ["C-41"] }),
    );
  });
});
