"use client";

import { useId, useState, type ReactNode } from "react";
import type { Matcher } from "react-day-picker";
import { cx } from "@/design-system/cx";
import { Calendar } from "./calendar";
import styles from "./date-picker.module.css";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

export interface DatePickerProps {
  id?: string;
  label: ReactNode;
  /** `YYYY-MM-DD`, same shape a native `type="date"` input used, or `""` when empty. */
  value: string;
  onChange: (value: string) => void;
  /** Replaces the hint slot; written in a human voice (matches `Field`). */
  error?: ReactNode;
  /** Forwarded to `Calendar`'s `disabled` (a day matching this can't be picked). */
  disabled?: Matcher | Matcher[];
  placeholder?: string;
  className?: string;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Parses a `YYYY-MM-DD` value into a local calendar `Date` (midnight, no
 * time zone maths) — the same convention the native date input's value
 * already used. Exported so `RollForm` can build `disabled` matchers (e.g.
 * "not before `shotFrom`") from the sibling field's raw string value.
 */
export function parseDateValue(value: string): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

/** The inverse of `parseDateValue`. */
export function formatDateValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDisplay(date: Date): string {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function CalendarGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15.5" rx="1.5" />
      <path d="M3.5 9.5h17M8 3v3M16 3v3" />
    </svg>
  );
}

/**
 * shadcn's Popover + Calendar pattern, restyled with our tokens — replaces
 * the native `type="date"` input, whose browser popup is unstyled and
 * always in English (owner feedback on `RollForm`'s past-mode dates).
 */
export function DatePicker({ id, label, value, onChange, error, disabled, placeholder, className }: DatePickerProps) {
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const hintId = `${triggerId}-hint`;
  const [open, setOpen] = useState(false);
  const selected = parseDateValue(value);

  return (
    <div className={cx(styles.field, className)}>
      <label className={styles.label} htmlFor={triggerId}>
        {label}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            id={triggerId}
            className={cx(styles.trigger, error ? styles.triggerError : undefined)}
            aria-describedby={error ? hintId : undefined}
          >
            <span className={cx(styles.value, !selected && styles.placeholder)}>{selected ? formatDisplay(selected) : (placeholder ?? "Chọn ngày")}</span>
            <CalendarGlyph />
          </button>
        </PopoverTrigger>
        <PopoverContent>
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            disabled={disabled}
            onSelect={(date) => {
              if (!date) return;
              onChange(formatDateValue(date));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {error ? (
        <span id={hintId} className={styles.error}>
          {error}
        </span>
      ) : null}
    </div>
  );
}
