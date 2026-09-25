import Link from "next/link";
import { useTranslations } from "next-intl";
import { cx } from "@/design-system/cx";
import styles from "./Footer.module.css";
import shared from "./Landing.module.css";
import { Sticker } from "./Sticker";

export function LandingFooter() {
  const t = useTranslations("landing.footer");
  const appName = useTranslations("common")("appName");

  return (
    <footer className={styles.footer}>
      <div className={cx(shared.inner, styles.inner)}>
        <Sticker name="reel" size={150} tilt={-10} className={styles.reel} />
        <div className={styles.brand}>
          <span className={styles.name}>{appName}</span>
          <span className={styles.tagline}>{t("tagline")}</span>
        </div>
        <nav className={styles.links} aria-label={t("navLabel")}>
          <Link className={styles.link} href="#features">
            {t("about")}
          </Link>
          <Link className={styles.link} href="/terms">
            {t("terms")}
          </Link>
          <Link className={styles.link} href="/privacy">
            {t("privacy")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
