import { screen } from "@testing-library/react";
import { it, expect } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";
import SignUpPage from "./page";

it("renders exactly one heading with the sign-up title", () => {
  renderWithIntl(<SignUpPage />);

  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  expect(screen.getByRole("heading", { level: 1, name: "Cất cuộn phim đầu tiên lên kệ" })).toBeInTheDocument();
});

it("renders one Google button labelled for sign-up", () => {
  renderWithIntl(<SignUpPage />);

  expect(screen.getByRole("button", { name: "Đăng ký bằng Google" })).toBeInTheDocument();
});

it("cross-links to /sign-in", () => {
  renderWithIntl(<SignUpPage />);

  expect(screen.getByRole("link", { name: "Đăng nhập" })).toHaveAttribute("href", "/sign-in");
});

it("links the consent line to /terms and /privacy", () => {
  renderWithIntl(<SignUpPage />);

  expect(screen.getByRole("link", { name: "Điều khoản" })).toHaveAttribute("href", "/terms");
  expect(screen.getByRole("link", { name: "Chính sách riêng tư" })).toHaveAttribute("href", "/privacy");
});

it("lists the three perks", () => {
  renderWithIntl(<SignUpPage />);

  expect(screen.getByText("Kệ cuộn của riêng bạn")).toBeInTheDocument();
  expect(screen.getByText("Tấm ưng và cả oops")).toBeInTheDocument();
  expect(screen.getByText("Chia sẻ lên story")).toBeInTheDocument();
});
