import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/vi.json";
import { UploadProvider } from "@/features/uploads/client/UploadProvider";

const getSession = vi.hoisted(() => vi.fn());
const redirect = vi.hoisted(() => vi.fn(() => { throw new Error("NEXT_REDIRECT"); }));

vi.mock("@/lib/auth", () => ({ getAuth: vi.fn().mockReturnValue({ api: { getSession } }) }));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("next/navigation", () => ({ redirect, usePathname: () => "/", useSearchParams: () => new URLSearchParams() }));

import AppLayout from "./layout";

function renderLayout(ui: Awaited<ReturnType<typeof AppLayout>>) {
  // The root layout provides the upload queue in the app (Phase 2 D16).
  return render(
    <NextIntlClientProvider locale="vi" messages={messages}>
      <UploadProvider>{ui}</UploadProvider>
    </NextIntlClientProvider>,
  );
}

describe("(app) layout", () => {
  afterEach(() => {
    getSession.mockReset();
    redirect.mockClear();
  });

  it("wraps its children with the AppShell for a signed-in session", async () => {
    getSession.mockResolvedValue({
      session: { id: "s1" },
      user: { id: "u1", name: "Trúc Lê", email: "truc@gmail.com", image: null },
    });

    renderLayout(await AppLayout({ children: <p>Nội dung</p> }));

    expect(screen.getByText("Nội dung")).toBeInTheDocument();
    expect(screen.getAllByText("T").length).toBeGreaterThan(0); // avatar initial
  });

  it("redirects to /sign-in when there's no real session (stale cookie)", async () => {
    getSession.mockResolvedValue(null);

    await expect(AppLayout({ children: <p>Nội dung</p> })).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/sign-in");
  });
});
