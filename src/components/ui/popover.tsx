"use client";

import type { ComponentPropsWithoutRef } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cx } from "@/design-system/cx";
import styles from "./popover.module.css";

/**
 * shadcn's Popover pattern (Radix `Popover`), restyled with our tokens —
 * the base the `DatePicker` (owner feedback: replace the native
 * `type="date"` input) opens its `Calendar` in. Only `Content` needs a
 * wrapper; `Root`/`Trigger`/`Anchor` are used as Radix ships them.
 */
export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

export type PopoverContentProps = ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>;

export function PopoverContent({ className, align = "start", sideOffset = 8, ...props }: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content align={align} sideOffset={sideOffset} className={cx(styles.content, className)} {...props} />
    </PopoverPrimitive.Portal>
  );
}
