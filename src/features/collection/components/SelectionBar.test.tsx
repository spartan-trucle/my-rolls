import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl as render } from "@/i18n/test-utils";
import { SelectionBar } from "./SelectionBar";

const handlers = () => ({ onKeeper: vi.fn(), onOops: vi.fn(), onBlank: vi.fn(), onClear: vi.fn() });

describe("SelectionBar (COL-4, RollGrid boards)", () => {
  it("says how many frames are picked in a polite live region", () => {
    render(<SelectionBar count={3} {...handlers()} busy={false} error={null} />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("3 tấm đã chọn");
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("keeps an empty live region and no buttons while nothing is picked", () => {
    render(<SelectionBar count={0} {...handlers()} busy={false} error={null} />);
    expect(screen.getByRole("status")).toHaveTextContent("");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("Tấm ưng, Oops, Tấm trắng and Bỏ chọn call their handlers", async () => {
    const h = handlers();
    render(<SelectionBar count={2} {...h} busy={false} error={null} />);
    await userEvent.click(screen.getByRole("button", { name: "Tấm ưng" }));
    await userEvent.click(screen.getByRole("button", { name: "Oops" }));
    await userEvent.click(screen.getByRole("button", { name: "Tấm trắng" }));
    await userEvent.click(screen.getByRole("button", { name: "Bỏ chọn" }));
    expect([h.onKeeper, h.onOops, h.onBlank, h.onClear].map((f) => f.mock.calls.length)).toEqual([1, 1, 1, 1]);
  });

  it("Tấm ưng is the one primary control", () => {
    render(<SelectionBar count={2} {...handlers()} busy={false} error={null} />);
    expect(screen.getByRole("button", { name: "Tấm ưng" })).toHaveClass("primary");
    for (const name of ["Oops", "Tấm trắng", "Bỏ chọn"]) expect(screen.getByRole("button", { name })).not.toHaveClass("primary");
  });

  it("shows which marks every picked frame already has (D12)", () => {
    render(<SelectionBar count={2} {...handlers()} busy={false} error={null} pressed={{ keeper: true, blank: false }} />);
    expect(screen.getByRole("button", { name: "Tấm ưng" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Tấm trắng" })).toHaveAttribute("aria-pressed", "false");
  });

  it("disables every button while a save is in flight (R22)", () => {
    render(<SelectionBar count={2} {...handlers()} busy error={null} />);
    for (const name of ["Tấm ưng", "Oops", "Tấm trắng", "Bỏ chọn"]) expect(screen.getByRole("button", { name })).toBeDisabled();
  });

  it("shows a failed save as an alert", () => {
    render(<SelectionBar count={1} {...handlers()} busy={false} error="Chưa đánh dấu được, thử lại nhé" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Chưa đánh dấu được, thử lại nhé");
  });
});
