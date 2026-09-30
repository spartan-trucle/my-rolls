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
vi.mock("./OnboardFirstContent", () => ({
  OnboardFirstContent: () => <div data-testid="onboard-first-content" />,
}));

import OnboardFirstPage from "./page";

describe("OnboardFirstPage", () => {
  afterEach(() => {
    getSession.mockReset();
    redirectMock.mockClear();
  });

  it("redirects to /sign-in when there is no session", async () => {
    getSession.mockResolvedValue(null);

    await expect(OnboardFirstPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/sign-in");
  });

  it("renders OnboardFirstContent when signed in", async () => {
    getSession.mockResolvedValue({ user: { id: "user-1" } });

    const ui = await OnboardFirstPage();

    expect(ui.type.name).toBe("OnboardFirstContent");
  });
});
