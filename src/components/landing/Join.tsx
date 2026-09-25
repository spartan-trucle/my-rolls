import Link from "next/link";
import { useTranslations } from "next-intl";
import { ButtonLink, Print } from "@/design-system";
import { cx } from "@/design-system/cx";
import styles from "./Join.module.css";
import shared from "./Landing.module.css";
import { PHOTOS } from "./samples";
import { Sticker } from "./Sticker";

/**
 * The canvas has an email field here. Cuộn signs people in with Google only
 * (AUTH-1), so this sends them to /sign-up instead, with the Signup board's
 * own wording.
 */
export function Join() {
  const t = useTranslations("landing.join");
  const appName = useTranslations("common")("appName");
  const print = { src: PHOTOS.treeGoldenField, alt: t("printAlt"), caption: t("printCaption"), date: "21.06.25" };

  return (
    <section id="join" className={cx(shared.inner, styles.section)}>
      <div className={cx(styles.printWrap, shared.reveal)}>
        <Sticker name="smile" size={88} tilt={10} delay={0.2} className={styles.smile} />
        <Sticker name="sparkle" size={56} delay={0.8} className={styles.sparkle} />
        <Print {...print} format="instant" width={260} attach="tape" className={shared.mobileOnly} />
        <Print {...print} format="instant" width={440} attach="tape" tilt="left" className={shared.desktopOnly} />
      </div>
      <div className={cx(styles.text, shared.reveal)}>
        <p className={shared.eyebrow}>{t("eyebrow", { appName })}</p>
        <h2 className={shared.title}>{t("title")}</h2>
        <p className={shared.body}>{t("body")}</p>
        <div className={styles.cta}>
          <ButtonLink variant="primary" href="/sign-up">
            {t("signUp")}
          </ButtonLink>
          <p className={styles.hint}>{t("hint")}</p>
        </div>
        <p className={styles.signIn}>
          {t.rich("haveAccount", { signIn: (chunks) => <Link href="/sign-in">{chunks}</Link> })}
        </p>
      </div>
    </section>
  );
}
