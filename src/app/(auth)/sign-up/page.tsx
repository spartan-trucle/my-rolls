import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Icon } from "@/design-system";
import type { IconName } from "@/design-system";
import authText from "@/components/auth/authText.module.css";

function Perk({ icon, title, body }: { icon: IconName; title: ReactNode; body: ReactNode }) {
  return (
    <div className="grid grid-cols-[40px_1fr] items-start gap-3">
      <span className="flex h-10 w-10 items-center justify-center bg-cobalt-soft text-cobalt">
        <Icon name={icon} size={20} />
      </span>
      <div>
        <div className="text-body font-semibold">{title}</div>
        <div className="text-body-sm text-ink-muted">{body}</div>
      </div>
    </div>
  );
}

/** Signup step 1 board (D7): Google-only, so this differs from `/sign-in` only in copy and perks (D16). */
export default function SignUpPage() {
  const t = useTranslations("auth.signUp");

  return (
    <AuthLayout
      actions={
        <>
          <GoogleButton label={t("googleButton")} />
          <p className={authText.note}>
            {t.rich("consent", {
              terms: (chunks) => <Link href="/terms">{chunks}</Link>,
              privacy: (chunks) => <Link href="/privacy">{chunks}</Link>,
            })}
          </p>
          <p className={authText.crossLink}>
            {t.rich("crossLink", { link: (chunks) => <Link href="/sign-in">{chunks}</Link> })}
          </p>
        </>
      }
    >
      <div className="flex flex-col gap-1.5">
        <span className="text-label uppercase text-ink-muted">{t("stepLabel")}</span>
        <h1 className="font-display text-display-l font-semibold tracking-[-0.015em] lg:text-display-xl lg:tracking-[-0.02em]">
          {t("title")}
        </h1>
        <p className="text-body-sm text-ink-muted lg:text-body">{t("subtitle")}</p>
      </div>
      <div className="flex flex-col gap-4">
        <Perk icon="roll" title={t("perkShelfTitle")} body={t("perkShelfBody")} />
        <Perk icon="keeper" title={t("perkKeeperTitle")} body={t("perkKeeperBody")} />
        <Perk icon="share" title={t("perkShareTitle")} body={t("perkShareBody")} />
      </div>
    </AuthLayout>
  );
}
