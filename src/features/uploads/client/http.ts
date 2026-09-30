import type { ISlotRequestFile, ISlotResponse } from "./queue";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

/** B2's `/api/uploads/slots`. */
export function requestUploadSlots(rollId: string, files: ISlotRequestFile[]): Promise<ISlotResponse & { scanSetId: string }> {
  return postJson("/api/uploads/slots", { rollId, files });
}

/** B2's `/api/uploads/confirm`. */
export function confirmUploads(frameIds: string[]): Promise<{ ready: string[]; missing: string[] }> {
  return postJson("/api/uploads/confirm", { frameIds });
}

/**
 * PUT one object to its presigned R2 URL. XMLHttpRequest rather than fetch, because only XHR
 * reports upload progress. The Content-Type must match what was signed.
 */
export function putObject(url: string, body: Blob, contentType: string, onProgress?: (fraction: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`PUT ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("network"));
    xhr.ontimeout = () => reject(new Error("timeout"));
    xhr.send(body);
  });
}
