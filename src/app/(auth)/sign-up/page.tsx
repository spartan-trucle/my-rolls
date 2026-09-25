import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Icon } from "@/design-system";
import type { IconName } from "@/design-system";
import { cx } from "@/design-system/cx";
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
              terms: (chunks) => (
                <Link href="/terms" className={cx(authText.link, authText.legalLink)}>
                  {chunks}
                </Link>
              ),
              privacy: (chunks) => (
                <Link href="/privacy" className={cx(authText.link, authText.legalLink)}>
                  {chunks}
                </Link>
              ),
            })}
          </p>
          <p className={authText.crossLink}>
            {t.rich("crossLink", {
              link: (chunks) => (
                <Link href="/sign-in" className={authText.link}>
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </>
      }
    >
      {/* gap-4 (space-4, 16px): owner ask, heading to subtitle, both layouts. */}
      <div className="flex flex-col gap-4">
        <span className="text-label uppercase text-ink-muted">{t("stepLabel")}</span>
        {/* display-l at every width, `text-balance`: see the matching comment on /sign-in. This
            title is long enough that it's expected to wrap to two balanced lines. */}
        <h1 className="font-display text-display-l text-balance">{t("title")}</h1>
        <p className="text-body-sm text-ink-muted lg:text-body">{t("subtitle")}</p>
      </div>
      {/* gap-6 (space-6, 24px): owner ask, apart from the board's own 16px. */}
      <div className="flex flex-col gap-6">
        <Perk icon="roll" title={t("perkShelfTitle")} body={t("perkShelfBody")} />
        <Perk icon="keeper" title={t("perkKeeperTitle")} body={t("perkKeeperBody")} />
        <Perk icon="share" title={t("perkShareTitle")} body={t("perkShareBody")} />
      </div>
    </AuthLayout>
  );
}
