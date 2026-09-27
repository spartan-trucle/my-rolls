import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import messages from "../../messages/vi.json";
import type { IRollEntry } from "@/features/rolls/core";

const getSession = vi.hoisted(() => vi.fn());
const getSessionCookie = vi.hoisted(() => vi.fn());
const listRolls = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  getAuth: vi.fn().mockReturnValue({ api: { getSession } }),
}));

vi.mock("better-auth/cookies", () => ({ getSessionCookie }));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

vi.mock("@/features/rolls/actions", () => ({ listRolls }));

// `getTranslations` needs Next's request scope; the real messages through next-intl's own translator stand in.
vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  return {
    getTranslations: async (namespace: "landing") => createTranslator({ locale: "vi", messages, namespace }),
  };
});

import Home, { generateMetadata } from "./page";

function renderHome(ui: Awaited<ReturnType<typeof Home>>) {
  return render(<NextIntlClientProvider locale="vi" messages={messages}>{ui}</NextIntlClientProvider>);
}

const signedInSession = {
  session: { id: "s1" },
  user: { id: "u1", name: "Trúc Lê", email: "truc@gmail.com", image: null },
};

function makeRoll(overrides: Partial<IRollEntry>): IRollEntry {
  return {
    id: "roll-1",
    name: null,
    canisterColor: "gold",
    boxIso: 200,
    shotIso: 200,
    exposures: 36,
    format: "35mm",
    locations: null,
    shotFrom: new Date("2025-10-12T12:00:00Z"),
    shotTo: null,
    notes: null,
    memory: null,
    version: 1,
    createdAt: new Date("2025-10-12T12:00:00Z"),
    pushPull: "0",
    stock: { id: "stock-1", brand: "Kodak", name: "Gold 200", iso: 200, canisterColor: "gold" },
    camera: { brand: "Pentax", model: "K1000" },
    lens: null,
    ...overrides,
  };
}

describe("Home (/)", () => {
  afterEach(() => {
    getSession.mockReset();
    getSessionCookie.mockReset();
    listRolls.mockReset();
  });

  it("shows a visitor with no session cookie the landing page, without looking the session up", async () => {
    getSessionCookie.mockReturnValue(null);

    renderHome(await Home());

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Mọi cuộn phim,mọi cú lỡ tay.");
    expect(getSession).not.toHaveBeenCalled();
    expect(listRolls).not.toHaveBeenCalled();
  });

  it("shows the landing page when the session cookie is stale (the proxy is only optimistic)", async () => {
    getSessionCookie.mockReturnValue("a-stale-token");
    getSession.mockResolvedValue(null);

    renderHome(await Home());

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Mọi cuộn phim,mọi cú lỡ tay.");
  });

  it("greets the signed-in user by first name and shows the roll count", async () => {
    getSessionCookie.mockReturnValue("a-session-token");
    getSession.mockResolvedValue(signedInSession);
    listRolls.mockResolvedValue([makeRoll({ id: "roll-1" }), makeRoll({ id: "roll-2" })]);

    renderHome(await Home());

    expect(screen.getByRole("heading", { level: 1, name: "Kệ của Trúc" })).toBeInTheDocument();
    expect(screen.getByText("2 CUỘN")).toBeInTheDocument();
  });

  it("lists rolls newest first, each with its push/pull badge", async () => {
    getSessionCookie.mockReturnValue("a-session-token");
    getSession.mockResolvedValue(signedInSession);
    listRolls.mockResolvedValue([
      makeRoll({ id: "roll-newest", name: "Đà Lạt, tháng 10", pushPull: "+1" }),
      makeRoll({ id: "roll-oldest", name: "Chợ Lớn buổi sáng", pushPull: "−⅓" }),
    ]);

    renderHome(await Home());

    const links = screen.getAllByRole("link", { name: /Đà Lạt|Chợ Lớn/ });
    expect(links[0]).toHaveAttribute("href", "/rolls/roll-newest");
    expect(links[1]).toHaveAttribute("href", "/rolls/roll-oldest");
    // RollCard has no push/pull slot of its own (design-system.md): the
    // mapper folds it into the date it already renders.
    expect(screen.getByText(/12\.10\.25 · \+1/)).toBeInTheDocument();
    expect(screen.getByText(/12\.10\.25 · −⅓/)).toBeInTheDocument();
  });

  it("shows the empty state with a link to the first-roll onboarding when there are no rolls", async () => {
    getSessionCookie.mockReturnValue("a-session-token");
    getSession.mockResolvedValue(signedInSession);
    listRolls.mockResolvedValue([]);

    renderHome(await Home());

    expect(screen.getByText("Kệ của bạn còn trống")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cất cuộn đầu tiên" })).toHaveAttribute(
      "href",
      "/onboarding/first-roll",
    );
  });

  it("disables the Lưới (grid) view segment until Phase 3", async () => {
    getSessionCookie.mockReturnValue("a-session-token");
    getSession.mockResolvedValue(signedInSession);
    listRolls.mockResolvedValue([]);

    renderHome(await Home());

    const gridButton = screen.getByRole("button", { name: "Lưới" });
    expect(gridButton).toBeDisabled();
    expect(screen.getByRole("button", { name: "Kệ", pressed: true })).toBeInTheDocument();
  });

  it("describes the page for search and link previews", async () => {
    const metadata = await generateMetadata();
    expect(metadata.description).toMatch(/^Cuộn là nơi cất cuộn phim của bạn/);
  });
});
