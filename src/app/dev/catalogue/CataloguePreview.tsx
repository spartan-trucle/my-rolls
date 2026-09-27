"use client";

import { useId, useState } from "react";
import { Button } from "@/design-system";
import { ResponsiveDialog } from "@/components/overlay/ResponsiveDialog";
import { CataloguePicker } from "@/features/catalogue/components/CataloguePicker";
import { CustomEntryForm } from "@/features/catalogue/components/CustomEntryForm";
import type { TCatalogueKind } from "@/features/catalogue/queries";

type TMode = { view: "picker" } | { view: "custom"; kind: TCatalogueKind; query: string };

/**
 * D1: mounts `CataloguePicker` and `CustomEntryForm` inside
 * `ResponsiveDialog` so they can be tried without waiting for D2 (`/bag`)
 * or D3 (`/rolls/new`), which mount them for real. Requires a signed-in
 * session — the actions underneath are, like everywhere else, session-
 * checked (D19).
 */
export function CataloguePreview() {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<TMode>({ view: "picker" });
  const [log, setLog] = useState<string[]>([]);

  function openPicker() {
    setMode({ view: "picker" });
    setOpen(true);
  }

  return (
    <div className="flex flex-col gap-6 p-4 min-[600px]:p-6">
      <Button variant="primary" onClick={openPicker}>
        Mở danh mục
      </Button>

      {log.length > 0 ? (
        <ul className="flex flex-col gap-2 font-mono text-meta text-ink-muted">
          {log.map((line, index) => (
            <li key={index}>{line}</li>
          ))}
        </ul>
      ) : null}

      <ResponsiveDialog open={open} onClose={() => setOpen(false)} labelledBy={titleId}>
        {mode.view === "picker" ? (
          <CataloguePicker
            titleId={titleId}
            onPicked={(entry) => {
              const name = entry.kind === "stock" ? `${entry.brand} ${entry.name}` : `${entry.brand} ${entry.model}`;
              setLog((prev) => [`Đã chọn: ${name}`, ...prev]);
              setOpen(false);
            }}
            onAddCustom={(kind, query) => setMode({ view: "custom", kind, query })}
          />
        ) : (
          <CustomEntryForm
            titleId={titleId}
            initialKind={mode.kind}
            initialQuery={mode.query}
            onCreated={(entry) => {
              setLog((prev) => [`Đã thêm riêng (${entry.kind}), vào túi`, ...prev]);
              setOpen(false);
            }}
          />
        )}
      </ResponsiveDialog>
    </div>
  );
}
