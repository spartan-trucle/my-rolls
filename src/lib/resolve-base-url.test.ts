import { describe, expect, it } from "vitest";
import { PRODUCTION_URL } from "./auth-shared";
import { resolveBaseUrl } from "./resolve-base-url";

describe("resolveBaseUrl", () => {
  it("uses BETTER_AUTH_URL when set, before anything else", () => {
    const url = resolveBaseUrl({
      BETTER_AUTH_URL: "https://example.com",
      VERCEL_ENV: "production",
      VERCEL_BRANCH_URL: "my-rolls-git-main.vercel.app",
    });

    expect(url).toBe("https://example.com");
  });

  it("resolves to the production domain when VERCEL_ENV is production", () => {
    const url = resolveBaseUrl({ VERCEL_ENV: "production" });

    expect(url).toBe(PRODUCTION_URL);
  });

  it("resolves to the branch alias on preview deployments", () => {
    const url = resolveBaseUrl({
      VERCEL_ENV: "preview",
      VERCEL_BRANCH_URL: "my-rolls-git-feature-phase-0-setup-ngantrucles-projects.vercel.app",
    });

    expect(url).toBe(
      "https://my-rolls-git-feature-phase-0-setup-ngantrucles-projects.vercel.app",
    );
  });

  it("falls back to localhost when nothing else is set", () => {
    const url = resolveBaseUrl({});

    expect(url).toBe("http://localhost:3000");
  });

  it("falls back to localhost when VERCEL_ENV is preview but VERCEL_BRANCH_URL is missing", () => {
    const url = resolveBaseUrl({ VERCEL_ENV: "preview" });

    expect(url).toBe("http://localhost:3000");
  });
});
