"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button, Field } from "@/design-system";
import { updateNameAction, type IUpdateNameState } from "./actions";
import styles from "./page.module.css";

export interface NameFormProps {
  name: string;
}

const INITIAL_STATE: IUpdateNameState = {};

/**
 * `/profile/name` (F4): the display-name form, its own sub-route rather
 * than a bottom sheet / dialog — the design system has no sheet or dialog
 * primitive yet, and hand-rolling one (focus trap, ESC, backdrop) is out
 * of this task's scope. A route keeps the same accessible, keyboard- and
 * screen-reader-friendly behaviour a page already gets for free.
 */
export function NameForm({ name }: NameFormProps) {
  const t = useTranslations("profile.editName");
  const [state, formAction, pending] = useActionState(updateNameAction, INITIAL_STATE);

  const errorMessage =
    state.errorCode === "empty"
      ? t("nameErrorEmpty")
      : state.errorCode === "tooLong"
        ? t("nameErrorTooLong")
        : undefined;

  return (
    <main className="mx-auto flex max-w-[560px] flex-col gap-6 px-4 py-12 md:px-0 md:py-16">
      <Link href="/profile" className={styles.back}>
        {t("back")}
      </Link>
      <h1 className="font-display text-display-l font-semibold">{t("title")}</h1>
      <form action={formAction} className="flex flex-col gap-4">
        <Field
          name="name"
          label={t("nameLabel")}
          defaultValue={name}
          hint={errorMessage ? undefined : t("nameHint")}
          error={errorMessage}
        />
        <Button type="submit" variant="primary" disabled={pending} className={styles.saveButton}>
          {t("saveButton")}
        </Button>
      </form>
    </main>
  );
}
