"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button, Field, Scribble } from "@/design-system";
import { signOutToSignUpAction } from "@/lib/sign-out-action";
import { updateDisplayNameAction, type IUpdateDisplayNameState } from "./actions";
import styles from "./page.module.css";

export interface ProfileFormProps {
  name: string;
  email: string;
}

const FORM_ID = "profile-name-form";
const INITIAL_STATE: IUpdateDisplayNameState = {};

/**
 * Step 2's form (D18): the name field (with the email read-only beside it)
 * lives in one `<form>`; the primary "Tiếp tục" button sits outside it —
 * associated via the HTML `form` attribute, not DOM nesting — so it can
 * share a flex row with "Dùng tài khoản khác", a *different* form (signs
 * out) that can't nest inside the first one. `pending` comes straight from
 * `useActionState`, so the button disables correctly either way.
 */
export function ProfileForm({ name, email }: ProfileFormProps) {
  const t = useTranslations("auth.profile");
  const [state, formAction, pending] = useActionState(updateDisplayNameAction, INITIAL_STATE);

  const errorMessage =
    state.errorCode === "empty"
      ? t("nameErrorEmpty")
      : state.errorCode === "tooLong"
        ? t("nameErrorTooLong")
        : undefined;

  return (
    <>
      <form id={FORM_ID} action={formAction} className="flex flex-col gap-4">
        <Field
          name="name"
          label={t("nameLabel")}
          defaultValue={name}
          hint={errorMessage ? undefined : t("nameHint")}
          error={errorMessage}
        />
        <div className="flex flex-col gap-1.5">
          <span className={styles.readOnlyLabel}>{t("emailLabel")}</span>
          <div className={styles.readOnlyRow}>
            <span>{email}</span>
            <span className={styles.readOnlyBadge}>{t("emailFromGoogle")}</span>
          </div>
        </div>
      </form>

      <Scribble size="sm">{t("scribble")}</Scribble>

      <div className={styles.actionsRow}>
        <form action={signOutToSignUpAction}>
          <button type="submit" className={styles.switchAccount}>
            <span aria-hidden="true">‹ </span>
            <span className={styles.switchAccountPhone}>{t("switchAccountPhone")}</span>
            <span className={styles.switchAccountDesktop}>{t("switchAccountDesktop")}</span>
          </button>
        </form>
        <Button
          type="submit"
          form={FORM_ID}
          variant="primary"
          disabled={pending}
          className={styles.continueButton}
        >
          {t("continueButton")}
        </Button>
      </div>
    </>
  );
}
