import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/i18n/test-utils";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/features/labs/actions", () => ({
  searchLabsAction: vi.fn().mockResolvedValue([]),
  listLabCitiesAction: vi.fn().mockResolvedValue([]),
  addLabAction: vi.fn(),
}));

describe("/dev/labs", () => {
  beforeEach(() => {
    document.documentElement.setAttribute("data-theme", "light");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    document.documentElement.removeAttribute("data-theme");
  });

  it("is a 404 on production", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const { default: LabsDevPage } = await import("./page");
    expect(() => LabsDevPage()).toThrow("NEXT_NOT_FOUND");
  });

  it("renders the lab picker on preview and locally", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const { default: LabsDevPage } = await import("./page");
    renderWithIntl(<LabsDevPage />);
    expect(await screen.findByText("Tìm lab")).toBeInTheDocument();
  });

  it("switches to the add-lab form and back", async () => {
    const user = (await import("@testing-library/user-event")).default.setup();
    vi.stubEnv("VERCEL_ENV", "preview");
    const { default: LabsDevPage } = await import("./page");
    renderWithIntl(<LabsDevPage />);

    await user.click(await screen.findByRole("button", { name: "+ Thêm lab mới" }));
    expect(await screen.findByRole("button", { name: "Lưu lab" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "‹ Quay lại" }));
    expect(await screen.findByText("Tìm lab")).toBeInTheDocument();
  });
});
