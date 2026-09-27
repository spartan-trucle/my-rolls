"use client";

import { vi } from "date-fns/locale";
import { DayPicker, type DayPickerProps } from "react-day-picker";
import { cx } from "@/design-system/cx";
import styles from "./calendar.module.css";

export type CalendarProps = DayPickerProps;

function PreviousChevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function NextChevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

/**
 * shadcn's Calendar pattern (`react-day-picker`), restyled with our tokens
 * and locked to the `vi` `date-fns` locale (Vietnamese month/weekday names,
 * week starting Monday) — the `DatePicker` opens this in a `Popover`.
 */
export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      locale={vi}
      showOutsideDays={showOutsideDays}
      className={cx(styles.root, className)}
      classNames={{
        months: styles.months,
        month: styles.month,
        month_caption: styles.monthCaption,
        caption_label: styles.captionLabel,
        nav: styles.nav,
        button_previous: styles.navButton,
        button_next: styles.navButton,
        month_grid: styles.grid,
        weekdays: styles.weekdays,
        weekday: styles.weekday,
        weeks: styles.weeks,
        week: styles.week,
        day: styles.day,
        day_button: styles.dayButton,
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => (orientation === "left" ? <PreviousChevron /> : <NextChevron />),
      }}
      {...props}
    />
  );
}
