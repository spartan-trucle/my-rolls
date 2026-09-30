"use client";

import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { cx } from "@/design-system/cx";
import styles from "./ResponsiveDialog.module.css";

export interface ResponsiveDialogProps {
  open: boolean;
  onClose: () => void;
  /** id of the element that labels the dialog (`aria-labelledby`). */
  labelledBy: string;
  children: ReactNode;
  className?: string;
  /** `compact` (fix 3, the bag's delete confirm): a narrower, content-sized
   * box at 1024px and up instead of the full 840x772 catalogue dialog. No
   * effect on the phone sheet, which is always full height. */
  size?: "default" | "compact";
}

/**
 * A bottom sheet on phones, a centred dialog at 1024px and up (D1), built
 * on the native `<dialog>` so `showModal()` gives focus trapping, Esc and
 * the `::backdrop` scrim for free — `ResponsiveDialog.module.css` only
 * positions the box per breakpoint.
 *
 * `onClose` is only ever called from the dialog's own native "close"
 * event, never called directly by this component: a backdrop click asks
 * the dialog to `close()` itself (same as Esc), so there is exactly one
 * path back to the caller and no risk of calling `onClose` twice for one
 * dismissal.
 */
export function ResponsiveDialog({ open, onClose, labelledBy, children, className, size = "default" }: ResponsiveDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    function handleClose() {
      onCloseRef.current();
    }

    // Esc fires "cancel" first. jsdom (unlike a real browser) never wires
    // Esc to a modal dialog at all, so this is handled explicitly rather
    // than relied on as native default behaviour — `close()` is what
    // actually fires "close" (below) in both environments.
    function handleCancel(event: Event) {
      event.preventDefault();
      ref.current?.close();
    }

    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("cancel", handleCancel);
    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("cancel", handleCancel);
    };
  }, []);

  function handleClick(event: MouseEvent<HTMLDialogElement>) {
    // A click that lands on the <dialog> box itself (not a descendant)
    // missed every child, i.e. it hit the backdrop area within the box's
    // own edges — close it exactly like Esc does.
    if (event.target === ref.current) ref.current?.close();
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      className={cx(styles.dialog, size === "compact" && styles.compact, className)}
      onClick={handleClick}
    >
      <div className={styles.content}>{children}</div>
    </dialog>
  );
}
