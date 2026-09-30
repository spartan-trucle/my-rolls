import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_BYTES } from "./limits";

export interface IRejectedFile {
  name: string;
  bytes: number;
  reason: "too_big" | "wrong_type";
}

export function validateFiles(files: File[]): { accepted: File[]; rejected: IRejectedFile[] } {
  const accepted: File[] = [];
  const rejected: IRejectedFile[] = [];
  for (const file of files) {
    if (file.name.startsWith(".")) continue;
    if (!(ALLOWED_UPLOAD_TYPES as readonly string[]).includes(file.type)) {
      rejected.push({ name: file.name, bytes: file.size, reason: "wrong_type" });
    } else if (file.size > MAX_UPLOAD_BYTES) {
      rejected.push({ name: file.name, bytes: file.size, reason: "too_big" });
    } else {
      accepted.push(file);
    }
  }
  return { accepted, rejected };
}
