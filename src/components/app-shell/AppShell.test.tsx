import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl as render } from "@/i18n/test-utils";
import { UploadProvider, useUploads } from "@/features/uploads/client/UploadProvider";
import { AppShell } from "./AppShell";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

describe("AppShell", () => {
  it("renders both the top nav and the bottom tabs, plus its children", () => {
    render(
      <UploadProvider>
        <AppShell userInitial="T">
          <p>Nội dung trang</p>
        </AppShell>
      </UploadProvider>,
    );

    expect(screen.getByText("Nội dung trang")).toBeInTheDocument();
    // Both chrome pieces exist in the DOM; CSS breakpoints (untestable in
    // jsdom) decide which one is visible at a given width.
    expect(screen.getAllByRole("navigation", { name: "Điều hướng chính" }).length).toBeGreaterThan(0);
    // Both TopNav (desktop) and PhoneTopBar (G1) render the wordmark; CSS
    // breakpoints (untestable in jsdom) decide which is visible.
    expect(screen.getAllByText("Cuộn").length).toBeGreaterThan(0);
  });

  it("reads the upload queue from the root provider (Phase 2 D16)", () => {
    function Probe() {
      const { batches } = useUploads();
      return <p>{`uploads: ${batches.length}`}</p>;
    }
    render(
      <UploadProvider>
        <AppShell userInitial="T">
          <Probe />
        </AppShell>
      </UploadProvider>,
    );
    expect(screen.getByText("uploads: 0")).toBeInTheDocument();
  });

  it("shows the upload tray on every page once a batch starts (Phase 2 D16)", async () => {
    function Starter() {
      const { start } = useUploads();
      return (
        <button type="button" onClick={() => start("r1", [new File(["x"], "1.jpg", { type: "image/jpeg" })], 1, "Cuộn #16")}>
          start
        </button>
      );
    }
    render(
      <UploadProvider>
        <AppShell userInitial="T">
          <Starter />
        </AppShell>
      </UploadProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "start" }));
    // jsdom has no Worker, so the copies fail and the tray settles on its failed state.
    expect(await screen.findByRole("link", { name: /0\/1 xong · 1 tấm lỗi/ })).toHaveAttribute("href", "/rolls/r1?upload=1");
  });
});
