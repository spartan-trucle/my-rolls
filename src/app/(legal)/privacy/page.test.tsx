import { screen } from "@testing-library/react";
import { it, expect } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";
import PrivacyPage from "./page";

it("renders the privacy heading and the placeholder sentence (D19)", () => {
  renderWithIntl(<PrivacyPage />);

  expect(screen.getByRole("heading", { level: 1, name: "Chính sách riêng tư" })).toBeInTheDocument();
  expect(screen.getByText("Chúng tôi đang viết chính sách riêng tư. Quay lại sau nhé.")).toBeInTheDocument();
});
