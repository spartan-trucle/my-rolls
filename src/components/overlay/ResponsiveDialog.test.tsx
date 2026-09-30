import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ResponsiveDialog } from "./ResponsiveDialog";

function Harness({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <ResponsiveDialog open={open} onClose={onClose} labelledBy="dlg-title">
      <h2 id="dlg-title">Danh mục</h2>
      <button type="button">Trong hộp thoại</button>
    </ResponsiveDialog>
  );
}

describe("ResponsiveDialog", () => {
  it("is closed and renders nothing visible when open is false", () => {
    render(<Harness open={false} onClose={vi.fn()} />);
    expect(screen.getByRole("dialog", { hidden: true })).not.toHaveAttribute("open");
  });

  it("opens via showModal when open becomes true", () => {
    const { rerender } = render(<Harness open={false} onClose={vi.fn()} />);
    rerender(<Harness open={true} onClose={vi.fn()} />);

    expect(screen.getByRole("dialog")).toHaveAttribute("open");
    expect(screen.getByText("Trong hộp thoại")).toBeVisible();
  });

  it("calls onClose once when Esc (the dialog's native cancel) fires", () => {
    const onClose = vi.fn();
    render(<Harness open={true} onClose={onClose} />);
    const dialog = screen.getByRole("dialog");

    fireEvent(dialog, new Event("cancel", { cancelable: true }));

    expect(dialog).not.toHaveAttribute("open");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose once on a backdrop click, not on a click inside the content", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Harness open={true} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Trong hộp thoại" }));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes itself when the parent flips open back to false", () => {
    const { rerender } = render(<Harness open={true} onClose={vi.fn()} />);
    expect(screen.getByRole("dialog")).toHaveAttribute("open");

    rerender(<Harness open={false} onClose={vi.fn()} />);
    expect(screen.getByRole("dialog", { hidden: true })).not.toHaveAttribute("open");
  });
});
