import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cx } from "@/design-system/cx";
import styles from "./Field.module.css";

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  label: ReactNode;
  /** One plain sentence under the input. */
  hint?: ReactNode;
  /** Replaces the hint; written in a human voice. */
  error?: ReactNode;
  /** Space Mono, for ISO, stock and camera data. */
  mono?: boolean;
  /** Applied to the wrapper. */
  className?: string;
}

export function Field({ label, hint, error, mono, className, id, ...inputProps }: FieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const note = error ?? hint;

  return (
    <div className={cx(styles.field, className)}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <input
        {...inputProps}
        id={inputId}
        className={cx(styles.input, mono && styles.mono)}
        aria-describedby={note ? hintId : undefined}
        aria-invalid={error ? true : undefined}
      />
      {note ? (
        <span id={hintId} className={cx(styles.hint, error ? styles.error : undefined)}>
          {note}
        </span>
      ) : null}
    </div>
  );
}
