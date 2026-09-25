import { screen } from "@testing-library/react";
import { it, expect } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";
import SignInPage from "./page";

it("renders exactly one heading with the sign-in title", () => {
  renderWithIntl(<SignInPage />);

  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  expect(screen.getByRole("heading", { level: 1, name: "Chào mừng trở lại" })).toBeInTheDocument();
});

it("renders one Google button labelled for sign-in", () => {
  renderWithIntl(<SignInPage />);

  expect(screen.getByRole("button", { name: "Đăng nhập bằng Google" })).toBeInTheDocument();
});

it("cross-links to /sign-up, styled as a link (cobalt, not plain text — Stage F review, fix 1)", () => {
  renderWithIntl(<SignInPage />);

  const link = screen.getByRole("link", { name: "Tạo tài khoản" });
  expect(link).toHaveAttribute("href", "/sign-up");
  expect(link).toHaveClass("link");
});

it("shows the five sample photos as a film strip, with their alt text from messages", () => {
  renderWithIntl(<SignInPage />);

  expect(screen.getByAltText("Rừng thông trong sương")).toBeInTheDocument();
  expect(screen.getByAltText("Đèn lồng ban đêm")).toBeInTheDocument();
});
