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

import { updateNameAction } from "./actions";

function formDataWithName(name: string | null) {
  const formData = new FormData();
  if (name !== null) formData.set("name", name);
  return formData;
}

describe("updateNameAction", () => {
  afterEach(() => {
    updateUser.mockClear();
    redirectMock.mockClear();
  });

  it("rejects an empty name without calling Better Auth", async () => {
    const result = await updateNameAction({}, formDataWithName(""));

    expect(result).toEqual({ errorCode: "empty" });
    expect(updateUser).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("rejects a whitespace-only name as empty", async () => {
    const result = await updateNameAction({}, formDataWithName("   "));

    expect(result).toEqual({ errorCode: "empty" });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("treats a missing name field the same as empty", async () => {
    const result = await updateNameAction({}, formDataWithName(null));

    expect(result).toEqual({ errorCode: "empty" });
  });

  it("rejects a name over 50 characters", async () => {
    const result = await updateNameAction({}, formDataWithName("a".repeat(51)));

    expect(result).toEqual({ errorCode: "tooLong" });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("accepts a name exactly 50 characters long", async () => {
    await updateNameAction({}, formDataWithName("a".repeat(50)));

    expect(updateUser).toHaveBeenCalledWith({ body: { name: "a".repeat(50) }, headers: fakeRequestHeaders });
  });

  it("trims the name before saving it", async () => {
    await updateNameAction({}, formDataWithName("  Trúc Lê  "));

    expect(updateUser).toHaveBeenCalledWith({ body: { name: "Trúc Lê" }, headers: fakeRequestHeaders });
  });

  it("redirects to /profile after a successful save", async () => {
    await updateNameAction({}, formDataWithName("Trúc Lê"));

    expect(redirectMock).toHaveBeenCalledWith("/profile");
  });

  /**
   * Better Auth's `updateUser` reads the caller from the session cookie in
   * `headers()` — there is no user id anywhere in the request. Whatever
   * else a form submits, only the signed-in caller's own name is ever
   * forwarded, and only through those same request headers.
   */
  it("only ever updates the signed-in caller — extra form fields are never forwarded", async () => {
    const formData = formDataWithName("Trúc Lê");
    formData.set("userId", "someone-elses-id");
    formData.set("role", "admin");

    await updateNameAction({}, formData);

    expect(updateUser).toHaveBeenCalledExactlyOnceWith({
      body: { name: "Trúc Lê" },
      headers: fakeRequestHeaders,
    });
  });
});
