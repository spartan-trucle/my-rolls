import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LabsDevContent } from "./LabsDevContent";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Lab picker · Cuộn",
  robots: { index: false, follow: false },
};

/**
 * F2 / D13: `LabPicker` and `LabAddForm`, standing in for the roll page
 * that will host them in Phase 2 (LAB-3). Hidden in production, same gate
 * as `/dev/design-system`.
 */
export default function LabsDevPage() {
  if (process.env.VERCEL_ENV === "production") notFound();
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <span className="font-mono text-meta uppercase text-ink-muted">Dev · Labs</span>
        <ThemeToggle />
      </header>
      <LabsDevContent />
    </div>
  );
}
