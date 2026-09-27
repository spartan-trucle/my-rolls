"use client";

import Image from "next/image";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button, Field } from "@/design-system";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { signOutAction } from "@/lib/sign-out-action";
import { updateNameAction, type IUpdateNameState } from "./actions";
import styles from "./page.module.css";

export interface ProfileContentProps {
  name: string;
  email: string;
  image: string | null | undefined;
}

const FORM_ID = "profile-name-form";
const INITIAL_STATE: IUpdateNameState = {};

/**
 * `/profile` (F4, Phase 0 D18): the Google avatar, the display-name form,
 * the read-only email, the theme toggle and sign out. Deliberately
 * nothing else — stat tiles, "Túi của tôi", recent keepers, share links
 * and delete account belong to their own later tasks (Design finding 5).
 *
 * Unlike `/sign-up/profile`'s one-shot step 2, this form stays on the
 * page after saving: `updateNameAction` revalidates `/profile` instead of
 * redirecting, and this component shows "Đã lưu." in place of the hint
 * once the action returns a `savedName`.
 */
export function ProfileContent({ name, email, image }: ProfileContentProps) {
  const t = useTranslations("profile");
  const [state, formAction, pending] = useActionState(updateNameAction, INITIAL_STATE);
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  const errorMessage =
    state.errorCode === "empty"
      ? t("nameErrorEmpty")
      : state.errorCode === "tooLong"
        ? t("nameErrorTooLong")
        : undefined;
  const hint = errorMessage ? undefined : state.savedName ? t("nameSaved") : t("nameHint");

  return (
    <main className="mx-auto flex max-w-[1440px] flex-col gap-8 px-4 py-12 md:px-16 md:py-16">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-display-l font-semibold">{t("title")}</h1>
        <ThemeToggle />
      </div>

      <div className="flex flex-col gap-6">
        {image ? (
          <Image src={image} alt={t("avatarAlt")} width={72} height={72} className={styles.avatarImage} />
        ) : (
          <span className={styles.avatarFallback} role="img" aria-label={t("avatarAlt")}>
            {initial}
          </span>
        )}

        <form id={FORM_ID} action={formAction} className="flex flex-col gap-4">
          <div className={styles.nameRow}>
            <Field
              name="name"
              label={t("nameLabel")}
              defaultValue={name}
              hint={hint}
              error={errorMessage}
              className={styles.nameField}
            />
            <Button type="submit" variant="primary" disabled={pending} className={styles.saveButton}>
              {t("saveButton")}
            </Button>
          </div>
        </form>

        <div className="flex flex-col gap-1.5">
          <span className={styles.readOnlyLabel}>{t("emailLabel")}</span>
          <div className={styles.readOnlyRow}>
            <span>{email}</span>
            <span className={styles.readOnlyBadge}>{t("emailFromGoogle")}</span>
          </div>
        </div>
      </div>

      <form action={signOutAction}>
        <Button type="submit" variant="outline">
          {t("signOutButton")}
        </Button>
      </form>
    </main>
  );
}
