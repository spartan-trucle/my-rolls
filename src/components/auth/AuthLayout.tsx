import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Print, Scribble } from "@/design-system";
import { getSamplePhoto } from "@/lib/samples";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cx } from "@/design-system/cx";
import styles from "./AuthLayout.module.css";

export interface AuthLayoutProps {
  /** Title, subtitle and whatever else the page shows — same content at every width. Part of the 420px desktop column. */
  children: ReactNode;
  /** Buttons and links. Pinned to the bottom of the phone layout; stacked normally on desktop. */
  actions: ReactNode;
  /** Decorative content shown only below 1024px, between the header and `children` (the sign-in FilmStrip). */
  phoneStrip?: ReactNode;
}

// The desktop photo panel is identical on every "Đăng nhập" board (Login,
// Signup, Signup step 2 web): the same two D20 sample photos, same captions.
const KEEPER_PHOTO = getSamplePhoto("pineHillSunrise");
const OOPS_PHOTO = getSamplePhoto("hillsideLightLeak");

/**
 * The shared frame for every "Đăng nhập" board (D7): phone is a single
 * column (wordmark + ThemeToggle, then content, then actions pinned to the
 * bottom); desktop (>=1024px) is two equal columns — a photo panel on the
 * left, the form on the right.
 *
 * One DOM tree, no JS layout switch: `AuthLayout.module.css` moves
 * `.content`/`.actions` between the phone and desktop CSS Grid template.
 * The wordmark and the theme toggle each move to a spot in a *different*
 * grid cell *and* get restyled (the wordmark grows and joins the photo
 * panel's copy; the toggle leaves the header row for an absolutely
 * positioned corner) — further than a grid-area reassignment can reach, so
 * each is rendered twice, one copy hidden per breakpoint with `display:
 * none` (removed from the accessibility tree either way). This is the
 * ordinary responsive-nav trick, not a mistake.
 */
export function AuthLayout({ children, actions, phoneStrip }: AuthLayoutProps) {
  const t = useTranslations("auth.layout");
  const tCommon = useTranslations("common");
  const tSamples = useTranslations("samples");

  return (
    <div className={cx(styles.shell, "rc-paper")}>
      <div className={styles.topRow}>
        <span className={styles.wordmark}>{tCommon("appName")}</span>
        <ThemeToggle />
      </div>

      {phoneStrip ? <div className={styles.strip}>{phoneStrip}</div> : null}

      <div className={styles.photoPanel} aria-label={t("photoPanelLabel")}>
        <span className={styles.wordmarkDesktop}>{tCommon("appName")}</span>
        <div className={styles.photoArea}>
          <Print
            src={KEEPER_PHOTO.src}
            alt={tSamples(KEEPER_PHOTO.id)}
            caption={t("photoOneCaption")}
            date={t("photoOneDate")}
            width={440}
            attach="tape"
            tilt="left"
            className={styles.photoOne}
          />
          <Print
            src={OOPS_PHOTO.src}
            alt={tSamples(OOPS_PHOTO.id)}
            caption={t("photoTwoCaption")}
            width={240}
            attach="pin"
            tilt="right"
            oops
            className={styles.photoTwo}
          />
          <Scribble tone="pin" arrow="right" className={styles.panelScribble}>
            {t("scribble")}
          </Scribble>
        </div>
        <p className={styles.panelMeta}>{t("photoPanelMeta")}</p>
      </div>

      <div className={styles.main}>
        <div className={styles.themeDesktop}>
          <ThemeToggle />
        </div>
        <div className={styles.content}>{children}</div>
        <div className={styles.actions}>{actions}</div>
      </div>
    </div>
  );
}
