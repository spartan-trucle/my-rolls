import type { ReactNode } from "react";
import { cx } from "@/design-system/cx";
import { Icon } from "../Icon/Icon";
import type { IconName } from "../Icon/icons";
import styles from "./Stamp.module.css";

export type StampTone = "neutral" | "ink" | "keeper" | "oops";

interface BaseProps {
  tone?: StampTone;
  /** Filled. Only on top of a photo or film. */
  solid?: boolean;
  /** At most once per screen. */
  tilt?: boolean;
  className?: string;
  children?: ReactNode;
}

type TextStamp = BaseProps & { icon?: undefined; label?: string };
type IconStamp = BaseProps & { icon: IconName; label: string };

export type StampProps = TextStamp | IconStamp;

export function Stamp({ tone = "neutral", solid, tilt, icon, label, className, children }: StampProps) {
  const a11y = label ? { role: "img", "aria-label": label, title: label } : {};
  return (
    <span
      className={cx(styles.stamp, styles[tone], solid && styles.solid, tilt && styles.tilt, icon && styles.hasIcon, className)}
      {...a11y}
    >
      {icon ? <Icon name={icon} size={14} /> : null}
      {children}
    </span>
  );
}
