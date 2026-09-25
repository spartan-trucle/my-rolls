import Link from "next/link";
import { useTranslations } from "next-intl";
import { ButtonLink } from "@/design-system";
import { cx } from "@/design-system/cx";
import styles from "./Header.module.css";
import shared from "./Landing.module.css";
import { MobileMenu } from "./MobileMenu";

/** No logo: the name is set in Fraunces at weight 600 (design system: Iconography). */
export function LandingHeader() {
  const t = useTranslations("landing.header");
  const appName = useTranslations("common")("appName");

  const sections = [
    { href: "#features", label: t("features") },
    { href: "#shelf", label: t("shelf") },
    { href: "#join", label: t("share") },
  ];

  return (
    <header className={cx(shared.inner, styles.inner, styles.header)}>
      <Link className={styles.logo} href="/">
        {appName}
      </Link>
      <nav className={styles.nav} aria-label={t("navLabel")}>
        {sections.map((section) => (
          <Link key={section.href} className={styles.navLink} href={section.href}>
            {section.label}
          </Link>
        ))}
      </nav>
      <div className={styles.actions}>
        <ButtonLink variant="quiet" href="/sign-in">
          {t("signIn")}
        </ButtonLink>
        <ButtonLink className={shared.cobaltLink} href="/sign-up">
          {t("signUp")}
        </ButtonLink>
      </div>
      <div className={styles.phoneActions}>
        <Link className={cx(styles.navLink, styles.phoneSignUp)} href="/sign-up">
          {t("signUp")}
        </Link>
        <MobileMenu label={t("menu")} links={[...sections, { href: "/sign-in", label: t("signIn") }]} />
      </div>
    </header>
  );
}
