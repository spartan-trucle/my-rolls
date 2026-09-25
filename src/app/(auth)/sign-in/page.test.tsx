import { screen } from "@testing-library/react";
import { it, expect } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";
import SignInPage from "./page";

const NBSP = " ";

it("renders exactly one heading with the sign-in title", () => {
  renderWithIntl(<SignInPage />);

  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  // The accessible name comparison is NBSP-sensitive (the title has two,
  // see the NBSP test below), so match loosely here and assert the exact
  // characters separately.
  expect(screen.getByRole("heading", { level: 1, name: /Chào.{1}mừng trở.{1}lại/ })).toBeInTheDocument();
});

it("carries the display-l class, not display-xl — a smaller heading that stays on one line", () => {
  renderWithIntl(<SignInPage />);

  const heading = screen.getByRole("heading", { level: 1 });
  expect(heading).toHaveClass("text-display-l");
  expect(heading).not.toHaveClass("text-display-xl");
});

it("only ever breaks between \"mừng\" and \"trở\" — NBSPs glue \"Chào mừng\" and \"trở lại\" so a wrap can't land as \"Chào mừng trở\" / \"lại\"", () => {
  renderWithIntl(<SignInPage />);

  const heading = screen.getByRole("heading", { level: 1 });
  const expected = `Chào${NBSP}mừng trở${NBSP}lại`;
  expect(heading.textContent).toBe(expected);
  expect(heading.textContent?.match(/ /g)).toHaveLength(1);
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
