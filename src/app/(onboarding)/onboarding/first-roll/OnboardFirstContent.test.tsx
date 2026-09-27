import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";

const push = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { OnboardFirstContent } from "./OnboardFirstContent";

describe("OnboardFirstContent", () => {
  afterEach(() => {
    push.mockReset();
  });

  it("defaults to 'past' selected, and Bắt đầu goes to /rolls/new?mode=past", async () => {
    const user = userEvent.setup();
    renderWithIntl(<OnboardFirstContent />);

    expect(screen.getByRole("radio", { name: /Thêm cuộn đã chụp/ })).toBeChecked();

    await user.click(screen.getByRole("button", { name: "Bắt đầu" }));

    expect(push).toHaveBeenCalledWith("/rolls/new?mode=past");
  });

  it("switching to 'current' and Bắt đầu goes to /rolls/new", async () => {
    const user = userEvent.setup();
    renderWithIntl(<OnboardFirstContent />);

    await user.click(screen.getByRole("radio", { name: /Ghi cuộn đang chụp/ }));
    await user.click(screen.getByRole("button", { name: "Bắt đầu" }));

    expect(push).toHaveBeenCalledWith("/rolls/new");
  });

  it("'Để sau, xem kệ trước' and 'Bỏ qua' both link home", () => {
    renderWithIntl(<OnboardFirstContent />);

    expect(screen.getByRole("link", { name: "Để sau, xem kệ trước" })).toHaveAttribute("href", "/");
    // The step row (with "Bỏ qua") renders twice — once for the phone
    // layout, once for the desktop column — one hidden per breakpoint via
    // CSS, both present in jsdom (no real viewport).
    for (const link of screen.getAllByRole("link", { name: "Bỏ qua" })) {
      expect(link).toHaveAttribute("href", "/");
    }
  });
});
