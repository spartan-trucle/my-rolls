import { screen } from "@testing-library/react";
import { it, expect } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";
import TermsPage from "./page";

it("renders the terms heading and the placeholder sentence (D19)", () => {
  renderWithIntl(<TermsPage />);

  expect(screen.getByRole("heading", { level: 1, name: "Điều khoản" })).toBeInTheDocument();
  expect(screen.getByText("Chúng tôi đang viết điều khoản sử dụng. Quay lại sau nhé.")).toBeInTheDocument();
});
