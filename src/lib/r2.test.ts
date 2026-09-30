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

  it("rejects size 0, naming the value", async () => {
    stubR2Env();
    const { createPresignedUploadUrl, UploadValidationError } = await import("./r2");

    await expect(
      createPresignedUploadUrl({
        userId: "user-1",
        contentType: "image/jpeg",
        size: 0,
      }),
    ).rejects.toThrow(UploadValidationError);
    await expect(
      createPresignedUploadUrl({
        userId: "user-1",
        contentType: "image/jpeg",
        size: 0,
      }),
    ).rejects.toThrow(/0/);
  });

  it("rejects negative sizes, naming the value", async () => {
    stubR2Env();
    const { createPresignedUploadUrl, UploadValidationError } = await import("./r2");

    await expect(
      createPresignedUploadUrl({
        userId: "user-1",
        contentType: "image/jpeg",
        size: -1024,
      }),
    ).rejects.toThrow(UploadValidationError);
    await expect(
      createPresignedUploadUrl({
        userId: "user-1",
        contentType: "image/jpeg",
        size: -1024,
      }),
    ).rejects.toThrow(/-1024/);
  });

  it("rejects NaN, naming it", async () => {
    stubR2Env();
    const { createPresignedUploadUrl, UploadValidationError } = await import("./r2");

    await expect(
      createPresignedUploadUrl({
        userId: "user-1",
        contentType: "image/jpeg",
        size: NaN,
      }),
    ).rejects.toThrow(UploadValidationError);
    await expect(
      createPresignedUploadUrl({
        userId: "user-1",
        contentType: "image/jpeg",
        size: NaN,
      }),
    ).rejects.toThrow(/NaN/);
  });

  it("rejects non-integer sizes, naming the value", async () => {
    stubR2Env();
    const { createPresignedUploadUrl, UploadValidationError } = await import("./r2");

    await expect(
      createPresignedUploadUrl({
        userId: "user-1",
        contentType: "image/jpeg",
        size: 1024.5,
      }),
    ).rejects.toThrow(UploadValidationError);
    await expect(
      createPresignedUploadUrl({
        userId: "user-1",
        contentType: "image/jpeg",
        size: 1024.5,
      }),
    ).rejects.toThrow(/1024.5/);
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

describe("presignPut (Phase 2 B2)", () => {
  it("signs a PUT to the public bucket at the caller's key, with content-length signed", async () => {
    stubR2Env();
    const { presignPut } = await import("./r2");

    const url = await presignPut({ bucket: "public", key: "grid/abc.webp", contentType: "image/webp", size: 4096 });

    const parsed = new URL(url);
    expect(parsed.hostname).toBe(`${FAKE_R2_ENV.R2_BUCKET_PUBLIC}.${FAKE_R2_ENV.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`);
    expect(parsed.pathname).toBe("/grid/abc.webp");
    expect(parsed.searchParams.get("X-Amz-SignedHeaders")).toContain("content-length");
  });

  it("rejects an over-cap size before signing", async () => {
    stubR2Env();
    const { presignPut, UploadValidationError } = await import("./r2");

    await expect(
      presignPut({ bucket: "originals", key: "originals/u/x.jpg", contentType: "image/jpeg", size: 10 * 1024 * 1024 + 1 }),
    ).rejects.toBeInstanceOf(UploadValidationError);
  });
});

describe("headObject / deleteObjects (Phase 2 B2, B3)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the object's content length, or null when R2 says it isn't there", async () => {
    stubR2Env();
    const { S3Client } = await import("@aws-sdk/client-s3");
    const send = vi
      .spyOn(S3Client.prototype, "send")
      .mockResolvedValueOnce({ ContentLength: 2048 } as never)
      .mockRejectedValueOnce(Object.assign(new Error("NotFound"), { name: "NotFound", $metadata: { httpStatusCode: 404 } }));
    const { headObject } = await import("./r2");

    await expect(headObject({ bucket: "originals", key: "originals/u/a.jpg" })).resolves.toEqual({ contentLength: 2048 });
    await expect(headObject({ bucket: "public", key: "grid/missing.webp" })).resolves.toBeNull();
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("rethrows errors other than not-found, so a flaky R2 never looks like a missing file", async () => {
    stubR2Env();
    const { S3Client } = await import("@aws-sdk/client-s3");
    vi.spyOn(S3Client.prototype, "send").mockRejectedValueOnce(
      Object.assign(new Error("boom"), { $metadata: { httpStatusCode: 500 } }),
    );
    const { headObject } = await import("./r2");

    await expect(headObject({ bucket: "originals", key: "k" })).rejects.toThrow("boom");
  });

  it("deletes the given keys from the named bucket in one call, and does nothing for an empty list", async () => {
    stubR2Env();
    const { S3Client } = await import("@aws-sdk/client-s3");
    const send = vi.spyOn(S3Client.prototype, "send").mockResolvedValue({ Errors: [] } as never);
    const { deleteObjects } = await import("./r2");

    await deleteObjects({ bucket: "public", keys: [] });
    expect(send).not.toHaveBeenCalled();

    await deleteObjects({ bucket: "public", keys: ["grid/a.webp", "view/b.webp"] });
    const command = send.mock.calls[0][0] as { input: { Bucket: string; Delete: { Objects: Array<{ Key: string }> } } };
    expect(command.input.Bucket).toBe(FAKE_R2_ENV.R2_BUCKET_PUBLIC);
    expect(command.input.Delete.Objects).toEqual([{ Key: "grid/a.webp" }, { Key: "view/b.webp" }]);
  });

  it("throws when R2 reports any key it couldn't delete", async () => {
    stubR2Env();
    const { S3Client } = await import("@aws-sdk/client-s3");
    vi.spyOn(S3Client.prototype, "send").mockResolvedValue({ Errors: [{ Key: "grid/a.webp", Code: "InternalError" }] } as never);
    const { deleteObjects } = await import("./r2");

    await expect(deleteObjects({ bucket: "public", keys: ["grid/a.webp"] })).rejects.toThrow("grid/a.webp");
  });
});
