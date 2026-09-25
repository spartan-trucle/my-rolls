"use client";

import { useState } from "react";
import { UploadDrop } from "@/design-system";

export function UploadDropDemo() {
  const [names, setNames] = useState<string[]>([]);
  return (
    <div className="flex flex-col gap-2">
      <UploadDrop title="Thả cuộn vào đây" hint="hoặc chạm để chọn ảnh scan · JPEG, PNG" onFiles={(files) => setNames(files.map((f) => f.name))} />
      {names.length > 0 ? <p className="font-mono text-meta text-ink-muted">{names.join(", ")}</p> : null}
    </div>
  );
}
