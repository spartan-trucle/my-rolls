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

vi.mock("./actions", () => ({ updateDisplayNameAction: vi.fn() }));
vi.mock("@/lib/sign-out-action", () => ({ signOutToSignUpAction: vi.fn() }));

import SignUpProfilePage from "./page";

function renderPage(ui: Awaited<ReturnType<typeof SignUpProfilePage>>) {
  return render(
    <NextIntlClientProvider locale="vi" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("SignUpProfilePage (Signup step 2)", () => {
  afterEach(() => {
    getSession.mockReset();
    redirectMock.mockReset();
  });

  it("redirects to /sign-in when there is no session", async () => {
    getSession.mockResolvedValue(null);

    await SignUpProfilePage();

    expect(redirectMock).toHaveBeenCalledWith("/sign-in");
  });

  it("renders one heading, the step label, and the session's name/email", async () => {
    getSession.mockResolvedValue({
      session: { id: "s1" },
      user: { id: "u1", name: "Trúc Lê", email: "truc@gmail.com", image: null },
    });

    const ui = await SignUpProfilePage();
    renderPage(ui);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Chào bạn mới!" })).toBeInTheDocument();
    expect(screen.getByText("Bước 2 / 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Tên hiển thị")).toHaveValue("Trúc Lê");
    expect(screen.getByText("truc@gmail.com")).toBeInTheDocument();
  });

  it("shows a Fraunces-initial avatar fallback when there is no Google image", async () => {
    getSession.mockResolvedValue({
      session: { id: "s1" },
      user: { id: "u1", name: "Trúc Lê", email: "truc@gmail.com", image: null },
    });

    const ui = await SignUpProfilePage();
    renderPage(ui);

    const avatar = screen.getByLabelText("Ảnh đại diện từ Google");
    expect(avatar).toHaveTextContent("T");
  });

  it("renders the Google avatar image when the session has one", async () => {
    getSession.mockResolvedValue({
      session: { id: "s1" },
      user: {
        id: "u1",
        name: "Trúc Lê",
        email: "truc@gmail.com",
        image: "https://lh3.googleusercontent.com/a/avatar.jpg",
      },
    });

    const ui = await SignUpProfilePage();
    renderPage(ui);

    expect(screen.getByAltText("Ảnh đại diện từ Google")).toBeInTheDocument();
  });
});
