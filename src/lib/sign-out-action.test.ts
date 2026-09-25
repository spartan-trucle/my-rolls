import { describe, expect, it, vi } from "vitest";

const signOut = vi.hoisted(() => vi.fn().mockResolvedValue({ success: true }));
const redirectMock = vi.hoisted(() => vi.fn());
const fakeRequestHeaders = vi.hoisted(() => ({ __brand: "fake-headers" }));

vi.mock("@/lib/auth", () => ({
  getAuth: vi.fn().mockReturnValue({ api: { signOut } }),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(fakeRequestHeaders),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import { signOutAction, signOutToSignUpAction } from "./sign-out-action";

describe("signOutAction", () => {
  it("clears the session through Better Auth's own sign-out API", async () => {
    await signOutAction();

    expect(signOut).toHaveBeenCalledWith({ headers: fakeRequestHeaders });
  });

  it("redirects to /sign-in after clearing the session", async () => {
    await signOutAction();

    expect(redirectMock).toHaveBeenCalledWith("/sign-in");
  });
});

describe("signOutToSignUpAction", () => {
  it("clears the session through Better Auth's own sign-out API", async () => {
    await signOutToSignUpAction();

    expect(signOut).toHaveBeenCalledWith({ headers: fakeRequestHeaders });
  });

  it("redirects to /sign-up instead of /sign-in (step 2's 'dùng tài khoản khác')", async () => {
    await signOutToSignUpAction();

    expect(redirectMock).toHaveBeenCalledWith("/sign-up");
  });
});
