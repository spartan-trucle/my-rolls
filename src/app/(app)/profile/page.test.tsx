import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/vi.json";

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

vi.mock("./actions", () => ({ updateNameAction: vi.fn() }));
vi.mock("@/lib/sign-out-action", () => ({ signOutAction: vi.fn() }));

import ProfilePage from "./page";

function renderPage(ui: Awaited<ReturnType<typeof ProfilePage>>) {
  return render(
    <NextIntlClientProvider locale="vi" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("ProfilePage", () => {
  afterEach(() => {
    getSession.mockReset();
    redirectMock.mockReset();
  });

  it("redirects to /sign-in when there is no session", async () => {
    getSession.mockResolvedValue(null);

    await ProfilePage();

    expect(redirectMock).toHaveBeenCalledWith("/sign-in");
  });

  it("renders the signed-in user's name and read-only email", async () => {
    getSession.mockResolvedValue({
      session: { id: "s1" },
      user: { id: "u1", name: "Trúc Lê", email: "truc@gmail.com", image: null },
    });

    const ui = await ProfilePage();
    renderPage(ui);

    expect(screen.getByLabelText("Tên hiển thị")).toHaveValue("Trúc Lê");
    expect(screen.getByText("truc@gmail.com")).toBeInTheDocument();
  });

  it("renders the sign-out button", async () => {
    getSession.mockResolvedValue({
      session: { id: "s1" },
      user: { id: "u1", name: "Trúc Lê", email: "truc@gmail.com", image: null },
    });

    const ui = await ProfilePage();
    renderPage(ui);

    expect(screen.getByRole("button", { name: "Đăng xuất" })).toBeInTheDocument();
  });
});
