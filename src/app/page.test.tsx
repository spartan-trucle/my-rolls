import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import messages from "../../messages/vi.json";

const getSession = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() => vi.fn());
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

import Home from "./page";

function renderHome(ui: Awaited<ReturnType<typeof Home>>) {
  return render(<NextIntlClientProvider locale="vi" messages={messages}>{ui}</NextIntlClientProvider>);
}

describe("Home (D17 placeholder)", () => {
  afterEach(() => {
    getSession.mockReset();
    redirectMock.mockReset();
  });

  it("redirects to /sign-in when there is no session (the proxy is only optimistic)", async () => {
    getSession.mockResolvedValue(null);

    await Home();

    expect(redirectMock).toHaveBeenCalledWith("/sign-in");
  });

  it("greets the signed-in user by name, with one line of body and a sign-out button", async () => {
    getSession.mockResolvedValue({
      session: { id: "s1" },
      user: { id: "u1", name: "Trúc Lê", email: "truc@gmail.com", image: null },
    });

    const ui = await Home();
    renderHome(ui);

    expect(screen.getByRole("heading", { level: 1, name: "Kệ của Trúc Lê" })).toBeInTheDocument();
    expect(
      screen.getByText("Cuộn đầu tiên của bạn sắp có mặt ở đây."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đăng xuất" })).toBeInTheDocument();
  });

  it("renders the theme toggle", async () => {
    getSession.mockResolvedValue({
      session: { id: "s1" },
      user: { id: "u1", name: "Trúc Lê", email: "truc@gmail.com", image: null },
    });

    const ui = await Home();
    renderHome(ui);

    expect(screen.getByRole("button", { name: /Chuyển sang giao diện/ })).toBeInTheDocument();
  });
});
