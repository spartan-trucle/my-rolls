"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { cx, Icon } from "@/design-system";
import { rememberViewAction } from "../actions";
import styles from "./ViewSwitch.module.css";

type TSurface = "roll" | "library";
type TView = "shelf" | "grid" | "strip";

const SVG = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

/** The boards' own glyphs: a canister for Kệ, four squares for Lưới; the design system's `film` for Dải phim. */
const ICONS: Record<TView, ReactNode> = {
  shelf: (
    <svg {...SVG}>
      <path d="M6 7h9a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z" />
      <path d="M8.5 7V4h4v3" />
      <path d="M5 11.5h11M5 16.5h11" />
    </svg>
  ),
  grid: (
    <svg {...SVG}>
      <rect x="4" y="4" width="7" height="7" />
      <rect x="13" y="4" width="7" height="7" />
      <rect x="4" y="13" width="7" height="7" />
      <rect x="13" y="13" width="7" height="7" />
    </svg>
  ),
  strip: <Icon name="film" size={18} />,
};

export interface ViewSwitchProps {
  surface: TSurface;
  /** The view on screen; its link gets `aria-current="page"`. */
  current: string;
  /** One link per view, in display order. */
  hrefs: Partial<Record<TView, string>>;
  /** Views not built yet: shown, but not a link and not focusable (Ruling R7). */
  disabled?: readonly string[];
  /** Injected in tests; the server action otherwise. */
  remember?: (input: { surface: TSurface; view: string }) => Promise<void>;
  className?: string;
}

/**
 * COL-1 / COL-3: the Kệ/Lưới (library) or Dải phim/Lưới (roll) switch,
 * the boards' `.vseg`. Picking a view remembers it (plan D7) without ever
 * holding up the navigation.
 */
export function ViewSwitch({ surface, current, hrefs, disabled = [], remember = rememberViewAction, className }: ViewSwitchProps) {
  const t = useTranslations("views");
  const views = Object.entries(hrefs) as [TView, string][];

  return (
    <div role="group" aria-label={t("label")} className={cx(styles.switch, className)}>
      {views.map(([view, href]) => {
        const body = (
          <>
            {ICONS[view]}
            <span>{t(view)}</span>
          </>
        );
        if (disabled.includes(view)) {
          return (
            <span key={view} role="link" aria-disabled="true" className={styles.option}>
              {body}
            </span>
          );
        }
        return (
          <Link
            key={view}
            href={href}
            className={styles.option}
            aria-current={view === current ? "page" : undefined}
            onClick={() => {
              remember({ surface, view }).catch(() => {});
            }}
          >
            {body}
          </Link>
        );
      })}
    </div>
  );
}
