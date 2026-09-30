import { afterEach, describe, expect, it, vi } from "vitest";

const updateUser = vi.hoisted(() => vi.fn().mockResolvedValue({ status: true }));
const redirectMock = vi.hoisted(() => vi.fn());
const fakeRequestHeaders = vi.hoisted(() => ({ __brand: "fake-headers" }));

vi.mock("@/lib/auth", () => ({
  getAuth: vi.fn().mockReturnValue({ api: { updateUser } }),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(fakeRequestHeaders),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import { updateDisplayNameAction } from "./actions";

function formDataWithName(name: string | null) {
  const formData = new FormData();
  if (name !== null) formData.set("name", name);
  return formData;
}

describe("updateDisplayNameAction", () => {
  afterEach(() => {
    updateUser.mockClear();
    redirectMock.mockClear();
  });

  it("rejects an empty name without calling Better Auth", async () => {
    const result = await updateDisplayNameAction({}, formDataWithName(""));

    expect(result).toEqual({ errorCode: "empty" });
    expect(updateUser).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("rejects a whitespace-only name as empty", async () => {
    const result = await updateDisplayNameAction({}, formDataWithName("   "));

    expect(result).toEqual({ errorCode: "empty" });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("rejects a name over 50 characters", async () => {
    const result = await updateDisplayNameAction({}, formDataWithName("a".repeat(51)));

    expect(result).toEqual({ errorCode: "tooLong" });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("accepts a name exactly 50 characters long", async () => {
    await updateDisplayNameAction({}, formDataWithName("a".repeat(50)));

    expect(updateUser).toHaveBeenCalledWith({ body: { name: "a".repeat(50) }, headers: fakeRequestHeaders });
  });

  it("trims the name before saving it", async () => {
    await updateDisplayNameAction({}, formDataWithName("  Trúc Lê  "));

    expect(updateUser).toHaveBeenCalledWith({ body: { name: "Trúc Lê" }, headers: fakeRequestHeaders });
  });

  it("redirects to /onboarding/bag after a successful update (Phase 0 D17)", async () => {
    await updateDisplayNameAction({}, formDataWithName("Trúc Lê"));

    expect(redirectMock).toHaveBeenCalledWith("/onboarding/bag");
  });

  it("treats a missing name field the same as empty", async () => {
    const result = await updateDisplayNameAction({}, formDataWithName(null));

    expect(result).toEqual({ errorCode: "empty" });
  });
});
