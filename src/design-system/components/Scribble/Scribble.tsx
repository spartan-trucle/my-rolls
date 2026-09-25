import type { ReactNode } from "react";
import { cx } from "@/design-system/cx";
import styles from "./Scribble.module.css";

export interface ScribbleProps {
  arrow?: "none" | "left" | "right" | "down";
  /** `pin` for oops notes. */
  tone?: "ink" | "pin";
  size?: "md" | "sm";
  className?: string;
  /** Short and lowercase, 2 to 6 words. Never a required instruction. */
  children: ReactNode;
}

function Arrow() {
  return (
    <svg className={styles.arrow} viewBox="0 0 44 32" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 25C11 12 22 7 38 9" />
      <path d="M31 3l8 6-7 7" />
    </svg>
  );
}

export function Scribble({ arrow = "none", tone = "ink", size = "md", className, children }: ScribbleProps) {
  const cls = cx(
    styles.scribble,
    tone === "pin" && styles.pin,
    size === "sm" && styles.sm,
    arrow === "left" && styles.left,
    arrow === "down" && styles.down,
    className,
  );
  const text = <span>{children}</span>;
  if (arrow === "none") return <span className={cls}>{text}</span>;
  if (arrow === "left") return <span className={cls}><Arrow />{text}</span>;
  return <span className={cls}>{text}<Arrow /></span>;
}
