import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/design-system/cx";
import { Icon } from "../Icon/Icon";
import type { IconName } from "../Icon/icons";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "outline" | "quiet" | "doodle";

interface BaseProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** `primary` at most once per screen. `doodle` only on landing and empty states. */
  variant?: ButtonVariant;
  size?: "md" | "sm";
  icon?: IconName;
}

type LabelledButton = BaseProps & { children: ReactNode };
type IconOnlyButton = BaseProps & { children?: never; icon: IconName; "aria-label": string };

export type ButtonProps = LabelledButton | IconOnlyButton;

export function Button({ variant = "outline", size = "md", icon, className, children, type = "button", ...rest }: ButtonProps) {
  const iconOnly = icon !== undefined && (children === undefined || children === null || children === "");
  return (
    <button
      type={type}
      className={cx(styles.button, styles[variant], size === "sm" && styles.sm, iconOnly && styles.iconOnly, className)}
      {...rest}
    >
      {icon ? <Icon name={icon} size={size === "sm" ? 18 : 20} /> : null}
      {children}
    </button>
  );
}
