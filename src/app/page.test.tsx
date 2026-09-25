import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import messages from "../../messages/vi.json";

const getSession = vi.hoisted(() => vi.fn());
const getSessionCookie = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  getAuth: vi.fn().mockReturnValue({ api: { getSession } }),
}));

vi.mock("better-auth/cookies", () => ({ getSessionCookie }));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

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

describe("Home (/)", () => {
  afterEach(() => {
    getSession.mockReset();
    getSessionCookie.mockReset();
  });

  it("shows a visitor with no session cookie the landing page, without looking the session up", async () => {
    getSessionCookie.mockReturnValue(null);

    renderHome(await Home());

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Mọi cuộn phim,mọi cú lỡ tay.");
    expect(getSession).not.toHaveBeenCalled();
  });

  it("shows the landing page when the session cookie is stale (the proxy is only optimistic)", async () => {
    getSessionCookie.mockReturnValue("a-stale-token");
    getSession.mockResolvedValue(null);

    renderHome(await Home());

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Mọi cuộn phim,mọi cú lỡ tay.");
  });

  it("greets the signed-in user by name, with one line of body and a sign-out button", async () => {
    getSessionCookie.mockReturnValue("a-session-token");
    getSession.mockResolvedValue(signedInSession);

    renderHome(await Home());

    expect(screen.getByRole("heading", { level: 1, name: "Kệ của Trúc Lê" })).toBeInTheDocument();
    expect(screen.getByText("Cuộn đầu tiên của bạn sắp có mặt ở đây.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đăng xuất" })).toBeInTheDocument();
  });

  it("renders the theme toggle for signed-in users", async () => {
    getSessionCookie.mockReturnValue("a-session-token");
    getSession.mockResolvedValue(signedInSession);

    renderHome(await Home());

    expect(screen.getByRole("button", { name: /Chuyển sang giao diện/ })).toBeInTheDocument();
  });

  it("describes the page for search and link previews", async () => {
    const metadata = await generateMetadata();
    expect(metadata.description).toMatch(/^Cuộn là nơi cất cuộn phim của bạn/);
  });
});
