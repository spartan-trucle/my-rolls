import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl as render } from "@/i18n/test-utils";
import { BottomTabs } from "./BottomTabs";

const usePathname = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ usePathname }));

describe("BottomTabs", () => {
  it("marks Kệ current on /", () => {
    usePathname.mockReturnValue("/");
    render(<BottomTabs userInitial="T" />);
    expect(screen.getByRole("link", { name: /Kệ/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Túi/ })).not.toHaveAttribute("aria-current");
  });

  it("marks Túi current on /bag", () => {
    usePathname.mockReturnValue("/bag");
    render(<BottomTabs userInitial="T" />);
    expect(screen.getByRole("link", { name: /Túi/ })).toHaveAttribute("aria-current", "page");
  });

  it("marks Tôi current on /profile", () => {
    usePathname.mockReturnValue("/profile");
    render(<BottomTabs userInitial="T" />);
    expect(screen.getByRole("link", { name: /Tôi/ })).toHaveAttribute("aria-current", "page");
  });

  it("renders Tấm ưng disabled, not a link (no screen until Phase 3)", () => {
    usePathname.mockReturnValue("/");
    render(<BottomTabs userInitial="T" />);
    expect(screen.queryByRole("link", { name: /Tấm ưng/ })).not.toBeInTheDocument();
    const disabled = screen.getByText("Tấm ưng").closest("[aria-disabled]");
    expect(disabled).toHaveAttribute("aria-disabled", "true");
  });

  it("links to the bag, new roll and profile routes", () => {
    usePathname.mockReturnValue("/");
    render(<BottomTabs userInitial="T" />);
    expect(screen.getByRole("link", { name: /Túi/ })).toHaveAttribute("href", "/bag");
    expect(screen.getByRole("link", { name: /Cuộn mới/ })).toHaveAttribute("href", "/rolls/new");
    expect(screen.getByRole("link", { name: /Tôi/ })).toHaveAttribute("href", "/profile");
  });

  it("shows the user's avatar initial on the Tôi tab", () => {
    usePathname.mockReturnValue("/");
    render(<BottomTabs userInitial="X" />);
    expect(screen.getByText("X")).toBeInTheDocument();
  });

  it("renders nothing on /rolls/new (G4/N2: the page builds its own close header)", () => {
    usePathname.mockReturnValue("/rolls/new");
    const { container } = render(<BottomTabs userInitial="T" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing on a roll page (/rolls/[id])", () => {
    usePathname.mockReturnValue("/rolls/abc-123");
    const { container } = render(<BottomTabs userInitial="T" />);
    expect(container).toBeEmptyDOMElement();
  });
});
