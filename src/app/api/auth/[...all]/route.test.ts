import { describe, expect, it, vi } from "vitest";

const fakeResponse = new Response(null, { status: 204 });
const handler = vi.fn().mockResolvedValue(fakeResponse);

vi.mock("@/lib/auth", () => ({
  getAuth: vi.fn().mockReturnValue({ handler }),
}));

describe("auth route handler", () => {
  it("delegates GET to Better Auth's own handler", async () => {
    const { GET } = await import("./route");
    const request = new Request("http://localhost:3000/api/auth/get-session");

    const response = await GET(request);

    expect(handler).toHaveBeenCalledWith(request);
    expect(response).toBe(fakeResponse);
  });

  it("delegates POST to Better Auth's own handler", async () => {
    const { POST } = await import("./route");
    const request = new Request("http://localhost:3000/api/auth/sign-in/social", {
      method: "POST",
    });

    const response = await POST(request);

    expect(handler).toHaveBeenCalledWith(request);
    expect(response).toBe(fakeResponse);
  });
});
