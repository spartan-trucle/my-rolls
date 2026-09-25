import { screen } from "@testing-library/react";
import { it, expect } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";
import SignUpPage from "./page";

it("renders exactly one heading with the sign-up title", () => {
  renderWithIntl(<SignUpPage />);

  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  expect(screen.getByRole("heading", { level: 1, name: "Cất cuộn phim đầu tiên lên kệ" })).toBeInTheDocument();
});

it("carries the display-l class, not display-xl — expected to wrap to two balanced lines", () => {
  renderWithIntl(<SignUpPage />);

  const heading = screen.getByRole("heading", { level: 1 });
  expect(heading).toHaveClass("text-display-l");
  expect(heading).not.toHaveClass("text-display-xl");
});

it("renders one Google button labelled for sign-up", () => {
  renderWithIntl(<SignUpPage />);

  expect(screen.getByRole("button", { name: "Đăng ký bằng Google" })).toBeInTheDocument();
});

it("cross-links to /sign-in, styled as a link (cobalt, not plain text — Stage F review, fix 1)", () => {
  renderWithIntl(<SignUpPage />);

  const link = screen.getByRole("link", { name: "Đăng nhập" });
  expect(link).toHaveAttribute("href", "/sign-in");
  expect(link).toHaveClass("link");
});

it("links the consent line to /terms and /privacy, underlined so colour isn't the only cue (WCAG 1.4.1)", () => {
  renderWithIntl(<SignUpPage />);

  const terms = screen.getByRole("link", { name: "Điều khoản" });
  const privacy = screen.getByRole("link", { name: "Chính sách riêng tư" });
  expect(terms).toHaveAttribute("href", "/terms");
  expect(terms).toHaveClass("link", "legalLink");
  expect(privacy).toHaveAttribute("href", "/privacy");
  expect(privacy).toHaveClass("link", "legalLink");
});

it("lists the three perks", () => {
  renderWithIntl(<SignUpPage />);

  expect(screen.getByText("Kệ cuộn của riêng bạn")).toBeInTheDocument();
  expect(screen.getByText("Tấm ưng và cả oops")).toBeInTheDocument();
  expect(screen.getByText("Chia sẻ lên story")).toBeInTheDocument();
});
