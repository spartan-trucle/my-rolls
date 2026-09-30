import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl as render } from "@/i18n/test-utils";
import { useUploads } from "@/features/uploads/client/UploadProvider";
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
    // Both TopNav (desktop) and PhoneTopBar (G1) render the wordmark; CSS
    // breakpoints (untestable in jsdom) decide which is visible.
    expect(screen.getAllByText("Cuộn").length).toBeGreaterThan(0);
  });

  it("gives every page the upload queue, so a batch survives navigation (Phase 2 D16)", () => {
    function Probe() {
      const { batches } = useUploads();
      return <p>{`uploads: ${batches.length}`}</p>;
    }
    render(
      <AppShell userInitial="T">
        <Probe />
      </AppShell>,
    );
    expect(screen.getByText("uploads: 0")).toBeInTheDocument();
  });
});
