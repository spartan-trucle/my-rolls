import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";

const setStockExpiryYear = vi.hoisted(() => vi.fn());

vi.mock("@/features/bag/actions", () => ({ setStockExpiryYear }));

import { ExpiryYearField } from "./ExpiryYearField";

describe("ExpiryYearField", () => {
  afterEach(() => {
    setStockExpiryYear.mockReset();
  });

  it("shows a '+ Hạn dùng' chip when there's no expiry year yet", () => {
    renderWithIntl(<ExpiryYearField bagItemId="bag-1" expiryYear={null} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "+ Hạn dùng" })).toBeInTheDocument();
  });

  it("shows the set expiry year as a chip", () => {
    renderWithIntl(<ExpiryYearField bagItemId="bag-1" expiryYear={2024} onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Hết hạn 2024" })).toBeInTheDocument();
  });

  it("opens the editor, saves a year, and calls onChange", async () => {
    setStockExpiryYear.mockResolvedValue({ ok: true, expiryYear: 2023 });
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(<ExpiryYearField bagItemId="bag-1" expiryYear={null} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "+ Hạn dùng" }));
    await user.type(screen.getByRole("spinbutton"), "2023");
    await user.click(screen.getByRole("button", { name: "Lưu" }));

    expect(setStockExpiryYear).toHaveBeenCalledWith({ bagItemId: "bag-1", expiryYear: 2023 });
    expect(onChange).toHaveBeenCalledWith(2023);
  });

  it("clears an existing expiry year", async () => {
    setStockExpiryYear.mockResolvedValue({ ok: true, expiryYear: null });
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(<ExpiryYearField bagItemId="bag-1" expiryYear={2024} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Hết hạn 2024" }));
    await user.click(screen.getByRole("button", { name: "Bỏ hạn dùng" }));

    expect(setStockExpiryYear).toHaveBeenCalledWith({ bagItemId: "bag-1", expiryYear: null });
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
