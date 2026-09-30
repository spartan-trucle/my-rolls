"use client";

import { useState } from "react";
import { LabAddForm } from "@/features/labs/components/LabAddForm";
import { LabPicker, type ILabPick } from "@/features/labs/components/LabPicker";
import styles from "./page.module.css";

type TView = "pick" | "add";

/**
 * D13: `LabPicker` and `LabAddForm` have no host screen in Phase 1 — LAB-3
 * (the scan set that will mount them on a roll) is Phase 2 — so this dev
 * harness is where they're built and checked at 390 and 1440 px until
 * then. `heading` here stands in for the roll title a real host would
 * pass.
 */
export function LabsDevContent() {
  const [view, setView] = useState<TView>("pick");
  const [picked, setPicked] = useState<ILabPick | null>(null);

  function handlePick(pick: ILabPick) {
    setPicked(pick);
    setView("pick");
  }

  return (
    <div className={styles.card}>
      {view === "pick" ? (
        <LabPicker
          heading="Cuộn #14 · Gold 200"
          onPick={handlePick}
          onAddNew={() => setView("add")}
        />
      ) : (
        <LabAddForm onBack={() => setView("pick")} onCreated={() => setView("pick")} />
      )}
      {picked ? (
        <p className="text-body-sm text-ink-muted" data-testid="picked-result">
          labId={picked.labId} branchId={picked.branchId ?? "null"}
        </p>
      ) : null}
    </div>
  );
}
