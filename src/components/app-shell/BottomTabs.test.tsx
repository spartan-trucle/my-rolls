import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl as render } from "@/i18n/test-utils";
import { BottomTabs } from "./BottomTabs";

const usePathname = vi.hoisted(() => vi.fn());
const search = vi.hoisted(() => ({ params: new URLSearchParams() }));

vi.mock("next/navigation", () => ({ usePathname, useSearchParams: () => search.params }));

afterEach(() => {
  search.params = new URLSearchParams();
});

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

  it("Tấm ưng links to the library's keepers (D15)", () => {
    usePathname.mockReturnValue("/");
    render(<BottomTabs userInitial="T" />);
    expect(screen.getByRole("link", { name: /Tấm ưng/ })).toHaveAttribute("href", "/?view=grid&filter=keeper");
    expect(screen.getByRole("link", { name: /Tấm ưng/ })).not.toHaveAttribute("aria-current");
  });

  it("marks Tấm ưng current, not Kệ, on the library's keepers (Ruling R28)", () => {
    usePathname.mockReturnValue("/");
    search.params = new URLSearchParams("view=grid&filter=keeper");
    render(<BottomTabs userInitial="T" />);
    expect(screen.getByRole("link", { name: /Tấm ưng/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Kệ/ })).not.toHaveAttribute("aria-current");
  });

  it("keeps Kệ current on the library grid under another filter", () => {
    usePathname.mockReturnValue("/");
    search.params = new URLSearchParams("view=grid&filter=oops");
    render(<BottomTabs userInitial="T" />);
    expect(screen.getByRole("link", { name: /Kệ/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Tấm ưng/ })).not.toHaveAttribute("aria-current");
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
