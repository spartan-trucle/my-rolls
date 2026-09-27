import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl as render } from "@/i18n/test-utils";
import { AppShell } from "./AppShell";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

describe("AppShell", () => {
  it("renders both the top nav and the bottom tabs, plus its children", () => {
    render(
      <AppShell userInitial="T">
        <p>Nội dung trang</p>
      </AppShell>,
    );

    expect(screen.getByText("Nội dung trang")).toBeInTheDocument();
    // Both chrome pieces exist in the DOM; CSS breakpoints (untestable in
    // jsdom) decide which one is visible at a given width.
    expect(screen.getAllByRole("navigation", { name: "Điều hướng chính" }).length).toBeGreaterThan(0);
    expect(screen.getByText("Cuộn")).toBeInTheDocument();
  });
});
