/** D1 / roadmap decision 2. Shared by the browser (validate.ts) and the server (src/lib/r2.ts). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ALLOWED_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type TAllowedUploadType = (typeof ALLOWED_UPLOAD_TYPES)[number];
