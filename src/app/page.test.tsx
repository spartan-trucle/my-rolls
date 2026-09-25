import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";
import Home from "./page";

it("shows the product name (common.appName) as the page heading", () => {
  renderWithIntl(<Home />);
  expect(screen.getByRole("heading", { level: 1, name: "Cuộn" })).toBeInTheDocument();
});
