"use client";

import Image from "next/image";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button, Field } from "@/design-system";
import { signOutToSignUpAction } from "@/lib/sign-out-action";
import { updateDisplayNameAction, type IUpdateDisplayNameState } from "./actions";
import styles from "./page.module.css";

export interface ProfileContentProps {
  name: string;
  email: string;
  image: string | null | undefined;
}

const FORM_ID = "profile-name-form";
const INITIAL_STATE: IUpdateDisplayNameState = {};

/**
 * Signup step 2's content (D18), one client component so `useActionState`
 * can drive both AuthLayout slots at once: the name-update `<form>` (with
 * the avatar, step label, title and subtitle) goes in `children`; the
 * primary "Tiếp tục" button and "Dùng tài khoản khác" go in `actions`, so
 * they're pinned to the bottom on the phone layout like every other auth
 * screen (Stage F review, fix 5). The button isn't a DOM descendant of the
 * form it submits — it's in a different AuthLayout slot — so it's
 * associated through the HTML `form` attribute instead; `pending` still
 * comes straight from this same `useActionState` call either way, no
 * `useFormStatus` (which needs real DOM nesting) required.
 */
export function ProfileContent({ name, email, image }: ProfileContentProps) {
  const t = useTranslations("auth.profile");
  const [state, formAction, pending] = useActionState(updateDisplayNameAction, INITIAL_STATE);
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  const errorMessage =
    state.errorCode === "empty"
      ? t("nameErrorEmpty")
      : state.errorCode === "tooLong"
        ? t("nameErrorTooLong")
        : undefined;

  return (
    <AuthLayout
      actions={
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
      }
    >
      {/* One wrapper, gap-6 (space-6, 24px, owner ask) between avatar / heading
          block / form: AuthLayout's own `.content` gap (space-8/space-12) is
          for the *shared* board-to-board rhythm and doesn't apply here, since
          this is a single child of it. */}
      <div className="flex flex-col gap-6">
        {image ? (
          <Image src={image} alt={t("avatarAlt")} width={72} height={72} className={styles.avatarImage} />
        ) : (
          <span className={styles.avatarFallback} role="img" aria-label={t("avatarAlt")}>
            {initial}
          </span>
        )}
        {/* gap-4 (space-4, 16px): owner ask, heading to subtitle (applied to the
            whole step-label/title/subtitle block uniformly). */}
        <div className="flex flex-col gap-4">
          <span className="text-label uppercase text-ink-muted">{t("stepLabel")}</span>
          {/* display-l at every width, `text-balance`: see the matching comment on /sign-in. */}
          <h1 className="font-display text-display-l text-balance">{t("title")}</h1>
          <p className="text-body-sm text-ink-muted lg:text-body">{t("subtitle")}</p>
        </div>

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
      </div>
    </AuthLayout>
  );
}
