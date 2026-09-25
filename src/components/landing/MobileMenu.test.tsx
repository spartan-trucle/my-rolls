import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MobileMenu } from "./MobileMenu";

const links = [
  { href: "#features", label: "Tính năng" },
  { href: "/sign-in", label: "Đăng nhập" },
];

describe("MobileMenu", () => {
  it("starts closed, with a named toggle", () => {
    render(<MobileMenu label="Trình đơn" links={links} />);
    expect(screen.getByRole("button", { name: "Trình đơn" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "Tính năng" })).not.toBeInTheDocument();
  });

  it("opens to show its links, and the toggle controls the menu", async () => {
    render(<MobileMenu label="Trình đơn" links={links} />);
    const toggle = screen.getByRole("button", { name: "Trình đơn" });
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const menu = screen.getByRole("navigation", { name: "Trình đơn" });
    expect(toggle).toHaveAttribute("aria-controls", menu.id);
    expect(screen.getByRole("link", { name: "Đăng nhập" })).toHaveAttribute("href", "/sign-in");
  });

  it("closes on Escape", async () => {
    render(<MobileMenu label="Trình đơn" links={links} />);
    await userEvent.click(screen.getByRole("button", { name: "Trình đơn" }));
    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Trình đơn" })).toHaveAttribute("aria-expanded", "false");
  });

  it("closes when a link is followed", async () => {
    render(<MobileMenu label="Trình đơn" links={links} />);
    await userEvent.click(screen.getByRole("button", { name: "Trình đơn" }));
    await userEvent.click(screen.getByRole("link", { name: "Tính năng" }));
    expect(screen.getByRole("button", { name: "Trình đơn" })).toHaveAttribute("aria-expanded", "false");
  });
});
