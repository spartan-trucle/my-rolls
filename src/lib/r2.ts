import "server-only";

import { randomUUID } from "node:crypto";
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import {
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
  type TAllowedUploadType,
} from "@/features/uploads/limits";

/**
 * Roadmap decision 2 (settled 30.09.2026): JPEG, PNG and WebP up to 10 MB. The values live in
 * `features/uploads/limits.ts` so the browser (validate.ts) and this signer can't drift apart.
 */
export const ALLOWED_UPLOAD_CONTENT_TYPES = ALLOWED_UPLOAD_TYPES;
export type TAllowedUploadContentType = TAllowedUploadType;

const EXTENSION_BY_CONTENT_TYPE: Record<TAllowedUploadContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const PUT_URL_EXPIRES_IN_SECONDS = 600; // 10 min (D34)
const GET_URL_EXPIRES_IN_SECONDS = 300; // 5 min (D34)

/** A rejected upload before it ever reaches R2 — bad content type or over the size cap (D33). */
export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

function isAllowedContentType(contentType: string): contentType is TAllowedUploadContentType {
  return (ALLOWED_UPLOAD_CONTENT_TYPES as readonly string[]).includes(contentType);
}

/**
 * R2 has no presigned POST, so no `content-length-range` (D33): the only
 * enforcement is rejecting an oversized upload before signing anything,
 * plus signing `ContentLength` itself (`createPresignedUploadUrl` below) so
 * R2 refuses a PUT body of any other size.
 */
function assertValidUpload(contentType: string, size: number): asserts contentType is TAllowedUploadContentType {
  if (!isAllowedContentType(contentType)) {
    throw new UploadValidationError(
      `Content type "${contentType}" isn't allowed — only ${ALLOWED_UPLOAD_CONTENT_TYPES.join(", ")}`,
    );
  }
  if (!Number.isInteger(size) || size <= 0) {
    throw new UploadValidationError(`Upload size must be a positive integer, got ${size}`);
  }
  if (size > MAX_UPLOAD_BYTES) {
    throw new UploadValidationError(`Upload is ${size} bytes, over the ${MAX_UPLOAD_BYTES} byte (10 MB) cap`);
  }
}

const r2EnvSchema = z.object({
  R2_ACCOUNT_ID: z.string().min(1, "R2_ACCOUNT_ID is required"),
  R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID is required"),
  R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY is required"),
  R2_BUCKET_ORIGINALS: z.string().min(1, "R2_BUCKET_ORIGINALS is required"),
  R2_BUCKET_PUBLIC: z.string().min(1, "R2_BUCKET_PUBLIC is required"),
  R2_PUBLIC_URL: z.string().min(1, "R2_PUBLIC_URL is required"),
});

export type TR2Env = z.infer<typeof r2EnvSchema>;

let cachedR2Env: TR2Env | null = null;

/**
 * Separate from `getEnv()` (`src/env.ts`) so the app still builds and runs
 * without R2 configured (D34) — only the code paths that actually need R2
 * (this module) call this, and only when they're used.
 */
export function getR2Env(): TR2Env {
  if (!cachedR2Env) {
    const result = r2EnvSchema.safeParse(process.env);
    if (!result.success) {
      const missingKeys = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
      throw new Error(`Invalid R2 environment variables: ${missingKeys}`);
    }
    cachedR2Env = result.data;
  }

  return cachedR2Env;
}

let cachedClient: S3Client | null = null;

function getR2Client(): S3Client {
  if (!cachedClient) {
    const env = getR2Env();
    cachedClient = new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
  }

  return cachedClient;
}

export interface ICreatePresignedUploadUrlInput {
  userId: string;
  contentType: string;
  /** Exact byte size the client will PUT — signed as `ContentLength` (D33). */
  size: number;
}

export interface IPresignedUploadUrl {
  url: string;
  /** `originals/<userId>/<uuid>.<ext>` (D34) — save this alongside the scan row once the PUT succeeds. */
  key: string;
}

/**
 * Presigns a PUT to the private `cuon-originals` bucket (D34). Rejects a
 * disallowed content type or an over-cap size before ever calling R2
 * (`assertValidUpload`) — presigning is local SigV4 signing, so this never
 * makes a network call either way.
 */
export async function createPresignedUploadUrl({
  userId,
  contentType,
  size,
}: ICreatePresignedUploadUrlInput): Promise<IPresignedUploadUrl> {
  assertValidUpload(contentType, size);

  const key = `originals/${userId}/${randomUUID()}.${EXTENSION_BY_CONTENT_TYPE[contentType]}`;
  const url = await presignPut({ bucket: "originals", key, contentType, size });

  return { url, key };
}

/** Which of the two buckets: private originals, or public derivatives behind the CDN. */
export type TR2Bucket = "originals" | "public";

function bucketName(bucket: TR2Bucket): string {
  const env = getR2Env();
  return bucket === "originals" ? env.R2_BUCKET_ORIGINALS : env.R2_BUCKET_PUBLIC;
}

export interface IPresignPutInput {
  bucket: TR2Bucket;
  /** Built by the caller (Phase 2 plan D10): `originals/<userId>/<frameId>.<ext>`, `grid/<uuid>.webp`… */
  key: string;
  contentType: string;
  /** Exact byte size the client will PUT, signed as `ContentLength` so R2 refuses any other size. */
  size: number;
}

/** Presigns a PUT at a caller-built key in either bucket, after the same type and size checks. */
export async function presignPut({ bucket, key, contentType, size }: IPresignPutInput): Promise<string> {
  assertValidUpload(contentType, size);

  const command = new PutObjectCommand({
    Bucket: bucketName(bucket),
    Key: key,
    ContentType: contentType,
    ContentLength: size,
  });

  return getSignedUrl(getR2Client(), command, { expiresIn: PUT_URL_EXPIRES_IN_SECONDS });
}

/**
 * Phase 2 plan D14: the confirm step checks every object exists at its expected size.
 * `null` only for a real 404; any other failure is thrown, so a flaky R2 never reads as missing.
 */
export async function headObject({ bucket, key }: { bucket: TR2Bucket; key: string }): Promise<{ contentLength: number } | null> {
  try {
    const result = await getR2Client().send(new HeadObjectCommand({ Bucket: bucketName(bucket), Key: key }));
    return { contentLength: result.ContentLength ?? 0 };
  } catch (err) {
    const status = (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (status === 404 || (err as { name?: string }).name === "NotFound") return null;
    throw err;
  }
}

/** Phase 2 plan D17: deletes up to 1,000 keys in one call; throws if R2 reports any it couldn't delete. */
export async function deleteObjects({ bucket, keys }: { bucket: TR2Bucket; keys: string[] }): Promise<void> {
  if (keys.length === 0) return;
  const result = await getR2Client().send(
    new DeleteObjectsCommand({
      Bucket: bucketName(bucket),
      Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
    }),
  );
  if (result.Errors && result.Errors.length > 0) {
    throw new Error(`R2 couldn't delete: ${result.Errors.map((e) => e.Key).join(", ")}`);
  }
}

export interface ICreatePresignedDownloadUrlInput {
  /** The `key` returned by `createPresignedUploadUrl`. */
  key: string;
}

/** Presigns a GET from the private `cuon-originals` bucket (D34). */
export async function createPresignedDownloadUrl({ key }: ICreatePresignedDownloadUrlInput): Promise<string> {
  const env = getR2Env();
  const command = new GetObjectCommand({ Bucket: env.R2_BUCKET_ORIGINALS, Key: key });

  return getSignedUrl(getR2Client(), command, { expiresIn: GET_URL_EXPIRES_IN_SECONDS });
}
