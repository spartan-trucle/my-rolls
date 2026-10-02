"use client";

import { useUploads } from "../client/UploadProvider";
import { UploadTray } from "./UploadTray";

/** Mounts the tray for the most recent batch, on every signed-in page (D16). */
export function ShellUploadTray() {
  const { batches } = useUploads();
  const batch = batches.at(-1) ?? null;
  return <UploadTray batch={batch} rollLabel={batch?.rollLabel ?? ""} />;
}
