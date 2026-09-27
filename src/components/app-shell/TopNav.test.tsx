import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl as render } from "@/i18n/test-utils";
import { TopNav } from "./TopNav";

const usePathname = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ usePathname }));

describe("TopNav", () => {
  it("marks Kệ current on /", () => {
    usePathname.mockReturnValue("/");
    render(<TopNav userInitial="T" />);
    expect(screen.getByRole("link", { name: "Kệ" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Túi" })).not.toHaveAttribute("aria-current");
  });

  it("marks Túi current on /bag", () => {
    usePathname.mockReturnValue("/bag");
    render(<TopNav userInitial="T" />);
    expect(screen.getByRole("link", { name: "Túi" })).toHaveAttribute("aria-current", "page");
  });

  it("renders Tấm ưng disabled, not a link", () => {
    usePathname.mockReturnValue("/");
    render(<TopNav userInitial="T" />);
    expect(screen.queryByRole("link", { name: "Tấm ưng" })).not.toBeInTheDocument();
    expect(screen.getByText("Tấm ưng").closest("[aria-disabled]")).toHaveAttribute("aria-disabled", "true");
  });

  it("shows the Cuộn wordmark, a Cuộn mới action, the theme toggle and the avatar", () => {
    usePathname.mockReturnValue("/");
    render(<TopNav userInitial="T" />);
    expect(screen.getByText("Cuộn")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Cuộn mới/ })).toHaveAttribute("href", "/rolls/new");
    expect(screen.getByRole("button", { name: /Chuyển sang giao diện/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Hồ sơ/ })).toHaveAttribute("href", "/profile");
  });
});
