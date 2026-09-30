import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl as render } from "@/i18n/test-utils";
import { PhoneTopBar } from "./PhoneTopBar";

const usePathname = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ usePathname }));

describe("PhoneTopBar", () => {
  it("shows the Cuộn wordmark and the avatar, linking to profile", () => {
    usePathname.mockReturnValue("/");
    render(<PhoneTopBar userInitial="T" />);

    expect(screen.getByRole("link", { name: "Cuộn" })).toHaveAttribute("href", "/");
    const avatar = screen.getByRole("link", { name: /Hồ sơ/ });
    expect(avatar).toHaveAttribute("href", "/profile");
    expect(avatar).toHaveTextContent("T");
  });

  it("renders nothing on /rolls/new (G4/N2)", () => {
    usePathname.mockReturnValue("/rolls/new");
    const { container } = render(<PhoneTopBar userInitial="T" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing on a roll page (/rolls/[id])", () => {
    usePathname.mockReturnValue("/rolls/abc-123");
    const { container } = render(<PhoneTopBar userInitial="T" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing on /profile — the Profile board has its own 'Hồ sơ' header", () => {
    usePathname.mockReturnValue("/profile");
    const { container } = render(<PhoneTopBar userInitial="T" />);
    expect(container).toBeEmptyDOMElement();
  });
});
