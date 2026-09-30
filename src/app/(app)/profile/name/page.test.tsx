import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../../messages/vi.json";

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

import NameSubPage from "./page";

function renderPage(ui: Awaited<ReturnType<typeof NameSubPage>>) {
  return render(
    <NextIntlClientProvider locale="vi" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("NameSubPage (/profile/name)", () => {
  afterEach(() => {
    getSession.mockReset();
    redirectMock.mockReset();
  });

  it("redirects to /sign-in when there is no session", async () => {
    getSession.mockResolvedValue(null);

    await NameSubPage();

    expect(redirectMock).toHaveBeenCalledWith("/sign-in");
  });

  it("renders the name form prefilled with the session's name", async () => {
    getSession.mockResolvedValue({
      session: { id: "s1" },
      user: { id: "u1", name: "Trúc Lê", email: "truc@gmail.com", image: null },
    });

    const ui = await NameSubPage();
    renderPage(ui);

    expect(screen.getByLabelText("Tên hiển thị")).toHaveValue("Trúc Lê");
  });
});
