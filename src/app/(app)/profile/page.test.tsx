import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/vi.json";

const getSession = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() => vi.fn());
const getProfileSummaryQuery = vi.hoisted(() => vi.fn());
const fakeRequestHeaders = vi.hoisted(() => ({ __brand: "fake-headers" }));

vi.mock("@/lib/auth", () => ({
  getAuth: vi.fn().mockReturnValue({ api: { getSession } }),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(fakeRequestHeaders),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/sign-out-action", () => ({ signOutAction: vi.fn() }));
vi.mock("@/db/client", () => ({ getDb: vi.fn().mockReturnValue({ __brand: "fake-db" }) }));
vi.mock("@/features/bag/queries", () => ({ getProfileSummary: getProfileSummaryQuery }));

import ProfilePage from "./page";

function renderPage(ui: Awaited<ReturnType<typeof ProfilePage>>) {
  return render(
    <NextIntlClientProvider locale="vi" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

const SESSION_USER = {
  id: "u1",
  name: "Trúc Lê",
  email: "truc@gmail.com",
  image: null,
  // A fixed instant, not a local-time `Date`, so this stays "25.09.26" in
  // Asia/Ho_Chi_Minh regardless of the machine/CI runner's own timezone.
  createdAt: new Date("2026-09-24T18:30:00Z"),
};

describe("ProfilePage", () => {
  beforeEach(() => {
    getProfileSummaryQuery.mockResolvedValue(null);
  });

  afterEach(() => {
    getSession.mockReset();
    redirectMock.mockReset();
    getProfileSummaryQuery.mockReset();
  });

  it("redirects to /sign-in when there is no session", async () => {
    getSession.mockResolvedValue(null);

    await ProfilePage();

    expect(redirectMock).toHaveBeenCalledWith("/sign-in");
  });

  it("renders the signed-in user's name, email and join date", async () => {
    getSession.mockResolvedValue({ session: { id: "s1" }, user: SESSION_USER });

    const ui = await ProfilePage();
    renderPage(ui);

    expect(screen.getByRole("heading", { level: 1, name: "Trúc Lê" })).toBeInTheDocument();
    expect(screen.getByText("truc@gmail.com")).toBeInTheDocument();
    expect(screen.getByText("Vào Cuộn từ 25.09.26")).toBeInTheDocument();
  });

  it("links to /profile/name to edit the display name (no inline form)", async () => {
    getSession.mockResolvedValue({ session: { id: "s1" }, user: SESSION_USER });

    const ui = await ProfilePage();
    renderPage(ui);

    expect(screen.getByRole("link", { name: /Sửa tên hiển thị/ })).toHaveAttribute("href", "/profile/name");
  });

  it("renders the sign-out button", async () => {
    getSession.mockResolvedValue({ session: { id: "s1" }, user: SESSION_USER });

    const ui = await ProfilePage();
    renderPage(ui);

    expect(screen.getByRole("button", { name: "Đăng xuất" })).toBeInTheDocument();
  });

  it("PR1/PR3: fetches the profile summary owner-scoped and renders the roll count", async () => {
    getSession.mockResolvedValue({ session: { id: "s1" }, user: SESSION_USER });
    getProfileSummaryQuery.mockResolvedValue({ rollCount: 7, cameras: [], stocks: [], joinedAt: null });

    const ui = await ProfilePage();
    renderPage(ui);

    expect(getProfileSummaryQuery).toHaveBeenCalledWith({ __brand: "fake-db" }, "u1");
    expect(screen.getByText("7 cuộn")).toBeInTheDocument();
  });
});
