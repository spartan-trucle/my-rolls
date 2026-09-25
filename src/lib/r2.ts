import "server-only";

import { randomUUID } from "node:crypto";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";

/** Suggested default of roadmap decision 2 (D32) — Known conflict #2, still open (due 01.11). */
export const ALLOWED_UPLOAD_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type TAllowedUploadContentType = (typeof ALLOWED_UPLOAD_CONTENT_TYPES)[number];

const EXTENSION_BY_CONTENT_TYPE: Record<TAllowedUploadContentType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB (roadmap decision 2 / D32)
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

  const env = getR2Env();
  const key = `originals/${userId}/${randomUUID()}.${EXTENSION_BY_CONTENT_TYPE[contentType]}`;

  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_ORIGINALS,
    Key: key,
    ContentType: contentType,
    ContentLength: size,
  });

  const url = await getSignedUrl(getR2Client(), command, { expiresIn: PUT_URL_EXPIRES_IN_SECONDS });

  return { url, key };
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
