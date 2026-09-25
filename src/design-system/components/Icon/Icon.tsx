import { cx } from "@/design-system/cx";
import styles from "./Icon.module.css";
import { ICON_PATHS, type IconName } from "./icons";

export interface IconProps {
  name: IconName;
  /** px. 20 in buttons and nav, 14 in stamps, 24 standalone. */
  size?: number;
  /** Accessible name. Leave it out when text next to the icon says the same thing. */
  label?: string;
  className?: string;
}

export function Icon({ name, size = 20, label, className }: IconProps) {
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true };
  return (
    <svg
      className={cx(styles.icon, className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      {...a11y}
    >
      {ICON_PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
