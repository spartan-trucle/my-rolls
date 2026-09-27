import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";

const setStockQty = vi.hoisted(() => vi.fn());

vi.mock("@/features/bag/actions", () => ({ setStockQty }));

import { StockQtyStepper } from "./StockQtyStepper";

function setup(qty: number | null, onChange = vi.fn()) {
  const user = userEvent.setup();
  renderWithIntl(<StockQtyStepper bagItemId="bag-1" qty={qty} onChange={onChange} stockName="Gold 200" />);
  return { user, onChange };
}

describe("StockQtyStepper", () => {
  afterEach(() => {
    setStockQty.mockReset();
  });

  it("shows 0 and 'hết' when qty is null (not counted yet)", () => {
    setup(null);
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText(/hết/i)).toBeInTheDocument();
  });

  it("steps up optimistically, then calls onChange once the server confirms", async () => {
    setStockQty.mockResolvedValue({ ok: true, qty: 4 });
    const { user, onChange } = setup(3);

    await user.click(screen.getByRole("button", { name: /tăng/i }));

    expect(screen.getByText("4")).toBeInTheDocument(); // optimistic, before the promise settles below
    expect(setStockQty).toHaveBeenCalledWith({ bagItemId: "bag-1", qty: 4 });
    await screen.findByText("4");
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("reverts the optimistic count when the server call fails", async () => {
    setStockQty.mockResolvedValue({ ok: false, error: "validation" });
    const { user, onChange } = setup(3);

    await user.click(screen.getByRole("button", { name: /giảm/i }));

    expect(await screen.findByText("3")).toBeInTheDocument(); // reverted back from the optimistic 2
    expect(onChange).not.toHaveBeenCalled();
  });

  it("never steps below 0", async () => {
    const { user } = setup(0);

    await user.click(screen.getByRole("button", { name: /giảm/i }));

    expect(setStockQty).not.toHaveBeenCalled();
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
