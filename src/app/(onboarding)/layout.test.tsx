import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const getSession = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
);
const fakeRequestHeaders = vi.hoisted(() => ({ __brand: "fake-headers" }));

vi.mock("@/lib/auth", () => ({ getAuth: vi.fn().mockReturnValue({ api: { getSession } }) }));
vi.mock("next/headers", () => ({ headers: vi.fn().mockResolvedValue(fakeRequestHeaders) }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));

import OnboardingLayout from "./layout";

describe("OnboardingLayout", () => {
  afterEach(() => {
    getSession.mockReset();
    redirectMock.mockClear();
  });

  it("redirects to /sign-in when there is no session", async () => {
    getSession.mockResolvedValue(null);

    await expect(OnboardingLayout({ children: <span /> })).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/sign-in");
  });

  it("renders children as-is (no AppShell, no tab bar) when signed in", async () => {
    getSession.mockResolvedValue({ user: { id: "user-1" } });

    const ui = await OnboardingLayout({ children: <span data-testid="child" /> });
    render(ui);

    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});
