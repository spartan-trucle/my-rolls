import { afterEach, describe, expect, it, vi } from "vitest";

const FAKE_R2_ENV = {
  R2_ACCOUNT_ID: "fake-account",
  R2_ACCESS_KEY_ID: "fake-access-key",
  R2_SECRET_ACCESS_KEY: "fake-secret-key",
  R2_BUCKET_ORIGINALS: "cuon-originals",
  R2_BUCKET_PUBLIC: "cuon-public",
  R2_PUBLIC_URL: "https://pub-fake.r2.dev",
};

function stubR2Env(overrides: Partial<typeof FAKE_R2_ENV> = {}) {
  for (const [key, value] of Object.entries({ ...FAKE_R2_ENV, ...overrides })) {
    vi.stubEnv(key, value);
  }
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("ALLOWED_UPLOAD_CONTENT_TYPES", () => {
  it("is exactly jpeg, png and webp (D32)", async () => {
    const { ALLOWED_UPLOAD_CONTENT_TYPES } = await import("./r2");
    expect(ALLOWED_UPLOAD_CONTENT_TYPES).toEqual(["image/jpeg", "image/png", "image/webp"]);
  });
});

describe("getR2Env", () => {
  it("throws naming every missing key", async () => {
    const { getR2Env } = await import("./r2");
    let message = "";
    try {
      getR2Env();
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }

    for (const key of Object.keys(FAKE_R2_ENV)) {
      expect(message).toContain(key);
    }
  });

  it("returns typed values when every key is present", async () => {
    stubR2Env();
    const { getR2Env } = await import("./r2");
    expect(getR2Env()).toEqual(FAKE_R2_ENV);
  });
});

describe("createPresignedUploadUrl", () => {
  it("rejects a size over 10 MB, naming the size, before signing", async () => {
    stubR2Env();
    const { createPresignedUploadUrl, UploadValidationError } = await import("./r2");

    await expect(
      createPresignedUploadUrl({
        userId: "user-1",
        contentType: "image/jpeg",
        size: 10 * 1024 * 1024 + 1,
      }),
    ).rejects.toThrow(UploadValidationError);
    await expect(
      createPresignedUploadUrl({
        userId: "user-1",
        contentType: "image/jpeg",
        size: 10 * 1024 * 1024 + 1,
      }),
    ).rejects.toThrow(/10485761/);
  });

  it("accepts exactly 10 MB", async () => {
    stubR2Env();
    const { createPresignedUploadUrl } = await import("./r2");

    await expect(
      createPresignedUploadUrl({ userId: "user-1", contentType: "image/jpeg", size: 10 * 1024 * 1024 }),
    ).resolves.toMatchObject({});
  });

  it.each(["image/tiff", "image/gif"])("rejects content type %s", async (contentType) => {
    stubR2Env();
    const { createPresignedUploadUrl, UploadValidationError } = await import("./r2");

    await expect(
      createPresignedUploadUrl({ userId: "user-1", contentType, size: 1024 }),
    ).rejects.toThrow(UploadValidationError);
  });

  it("builds the key as originals/<userId>/<uuid>.<ext> with the extension from the content type", async () => {
    stubR2Env();
    const { createPresignedUploadUrl } = await import("./r2");

    const { key } = await createPresignedUploadUrl({
      userId: "user-42",
      contentType: "image/png",
      size: 1024,
    });

    expect(key).toMatch(
      /^originals\/user-42\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/,
    );
  });

  it("signs a PUT url with a 600s expiry and the content-length header (D33, D34)", async () => {
    stubR2Env();
    const { createPresignedUploadUrl } = await import("./r2");

    const { url } = await createPresignedUploadUrl({
      userId: "user-1",
      contentType: "image/jpeg",
      size: 2048,
    });

    const parsed = new URL(url);
    expect(parsed.searchParams.get("X-Amz-Expires")).toBe("600");
    expect(parsed.searchParams.get("X-Amz-SignedHeaders")).toContain("content-length");
    expect(parsed.hostname).toBe(`${FAKE_R2_ENV.R2_BUCKET_ORIGINALS}.${FAKE_R2_ENV.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`);
  });
});

describe("createPresignedDownloadUrl", () => {
  it("signs a GET url with a 300s expiry (D34)", async () => {
    stubR2Env();
    const { createPresignedDownloadUrl } = await import("./r2");

    const url = await createPresignedDownloadUrl({ key: "originals/user-1/abc.jpg" });

    const parsed = new URL(url);
    expect(parsed.searchParams.get("X-Amz-Expires")).toBe("300");
  });
});
