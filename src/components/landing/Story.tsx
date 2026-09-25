import Image from "next/image";
import { useTranslations } from "next-intl";
import type { CSSProperties, ReactNode } from "react";
import { Button, ButtonLink, Print, Stamp } from "@/design-system";
import { cx } from "@/design-system/cx";
import shared from "./Landing.module.css";
import { CAMERA_SRC, PHOTOS, UPLOAD_THUMBS } from "./samples";
import { Sticker } from "./Sticker";
import styles from "./Story.module.css";

interface PanelProps {
  /** Describes the illustration; the mock screen inside is hidden from assistive tech. */
  label: string;
  /** Degrees the paper stack is turned. */
  tilt: number;
  /** Desktop only: nudges the panel off centre, alternating sides. */
  shift: number;
  caption: string;
  captionClassName: string;
  /** Phone: which side the caption hangs from. */
  captionSide: "start" | "end";
  sticker?: ReactNode;
  children: ReactNode;
}

function Panel({ label, tilt, shift, caption, captionClassName, captionSide, sticker, children }: PanelProps) {
  return (
    <li className={styles.item} style={{ "--shift": `${shift}px` } as CSSProperties}>
      <div className={styles.stack} role="img" aria-label={label} style={{ "--tilt": `${tilt}deg` } as CSSProperties}>
        <div className={cx(styles.sheet, styles.sheet1)} />
        <div className={cx(styles.sheet, styles.sheet2)} />
        <div className={styles.panel} inert>
          {children}
        </div>
        {sticker}
      </div>
      <p className={cx(styles.caption, captionClassName, captionSide === "end" ? styles.captionEnd : styles.captionStart)}>
        {caption}
      </p>
    </li>
  );
}

/** The dashed thread between panels. Inside the list it's an `li`, hidden from assistive tech. */
function Thread({ className, inList = false }: { className: string; inList?: boolean }) {
  const Tag = inList ? "li" : "div";
  return <Tag className={cx(styles.thread, className)} aria-hidden="true" />;
}

export function Story() {
  const t = useTranslations("landing.story");
  const tHero = useTranslations("landing.hero");
  const appName = useTranslations("common")("appName");

  return (
    <section id="features" className={cx(shared.inner, styles.section)}>
      <div className={cx(styles.head, shared.reveal)}>
        <h2 className={shared.title}>{t("title")}</h2>
        <p className={cx(shared.body, styles.intro)}>{t("intro")}</p>
      </div>
      <Thread className={styles.threadStart} />
      <p className={styles.startNote}>{t("start")}</p>

      <ol className={styles.list} aria-label={t("listLabel", { appName })}>
        <Panel
          label={t("shoot.label")}
          tilt={-1.2}
          shift={-80}
          caption={t("shoot.caption")}
          captionClassName={styles.captionShoot}
          captionSide="end"
          sticker={<Sticker name="bolt" size={84} tilt={-10} className={styles.stickerShoot} />}
        >
          <div className={cx(styles.corner, styles.cornerTL)} />
          <div className={cx(styles.corner, styles.cornerTR)} />
          <div className={cx(styles.corner, styles.cornerBL)} />
          <div className={cx(styles.corner, styles.cornerBR)} />
          <div className={styles.finderBar}>
            <span>
              {t("shoot.counter")} <span className={styles.exposure} />
              /36
            </span>
            <span>{t("shoot.exposure")}</span>
          </div>
          <div className={styles.finderPhoto}>
            <Image className={cx(shared.object, styles.finderCamera)} src={CAMERA_SRC} alt="" width={290} height={220} />
          </div>
          <p className={styles.finderNote}>{t("shoot.note")}</p>
          <div className={styles.flash} />
        </Panel>
        <Thread className={styles.threadBetween} inList />

        <Panel
          label={t("upload.label")}
          tilt={1.4}
          shift={80}
          caption={t("upload.caption")}
          captionClassName={styles.captionUpload}
          captionSide="start"
        >
          <div className={styles.screen}>
            <span className={styles.fieldLabel}>{t("upload.newRoll")}</span>
            <div className={styles.input}>
              {t("upload.rollName")}
              <span className={styles.caret} />
            </div>
            <span className={cx(styles.fieldLabel, styles.fieldLabelGap)}>{t("upload.stock")}</span>
            <div className={styles.stocks}>
              <span className={cx(styles.can, styles.gold, styles.canOn)} />
              <span className={cx(styles.can, styles.green)} />
              <span className={cx(styles.can, styles.blue)} />
              <span className={cx(styles.can, styles.mono)} />
              <span className={cx(styles.can, styles.rose)} />
              <span className={styles.stockName}>{t("upload.stockName")}</span>
            </div>
            <div className={styles.drop}>
              {UPLOAD_THUMBS.map((photo, i) => (
                // eslint-disable-next-line @next/next/no-img-element -- decorative thumbnails of pre-sized sample WebPs
                <img
                  key={photo}
                  className={styles.thumb}
                  src={PHOTOS[photo]}
                  alt=""
                  loading="lazy"
                  style={{ "--t": `${(i * 0.35).toFixed(2)}s` } as CSSProperties}
                />
              ))}
            </div>
            <div className={styles.bar}>
              <span />
            </div>
            <span className={styles.small}>{t("upload.progress")}</span>
          </div>
        </Panel>
        <Thread className={styles.threadBetween} inList />

        <Panel
          label={t("oops.label")}
          tilt={-0.8}
          shift={-60}
          caption={t("oops.caption")}
          captionClassName={styles.captionOops}
          captionSide="end"
        >
          <div className={styles.oopsBoard}>
            <div className={styles.oopsPrint}>
              <Print
                src={PHOTOS.lightLeakHillside}
                alt=""
                caption={t("oops.printCaption")}
                date="12.10.25"
                width={220}
                attach="pin"
                oops
              />
              <div className={styles.slam}>
                <Stamp tone="oops" icon="oops" label={t("oops.stamp")} solid>
                  {t("oops.stamp")}
                </Stamp>
              </div>
            </div>
            <p className={styles.oopsNote}>{t("oops.note")}</p>
          </div>
        </Panel>
        <Thread className={styles.threadBetween} inList />

        <Panel
          label={t("share.label")}
          tilt={1.1}
          shift={70}
          caption={t("share.caption")}
          captionClassName={styles.captionShare}
          captionSide="start"
          sticker={<Sticker name="heart" size={76} tilt={-12} className={styles.stickerShare} />}
        >
          <div className={cx(styles.screen, styles.screenShare)}>
            <p className={styles.rollName}>{t("share.rollName")}</p>
            <p className={styles.small}>{t("share.rollMeta")}</p>
            <div className={styles.thumbs}>
              {UPLOAD_THUMBS.slice(0, 3).map((photo) => (
                // eslint-disable-next-line @next/next/no-img-element -- decorative thumbnails of pre-sized sample WebPs
                <img key={photo} className={styles.thumb} src={PHOTOS[photo]} alt="" loading="lazy" />
              ))}
            </div>
            <div className={styles.shareRow}>
              <div className={styles.press}>
                <Button icon="share" tabIndex={-1}>
                  {t("share.button")}
                </Button>
              </div>
              <svg className={styles.cursor} viewBox="0 0 22 26" aria-hidden="true">
                <path d="M2 2 L2 21 L7 16 L11 24 L14 22.5 L10 15 L17 15 Z" />
              </svg>
            </div>
            <div className={styles.copied}>
              <Stamp tone="keeper" icon="share" label={t("share.copied")}>
                {t("share.copied")}
              </Stamp>
            </div>
            <div className={styles.viewers}>
              <div className={styles.avatars}>
                <span className={cx(styles.avatar, styles.avatarGold, styles.avatar1)}>KD</span>
                <span className={cx(styles.avatar, styles.avatarGreen, styles.avatar2)}>MN</span>
                <span className={cx(styles.avatar, styles.avatarBlue, styles.avatar3)}>TH</span>
              </div>
              <p className={cx(styles.viewersText, styles.avatar3)}>{t("share.viewers")}</p>
            </div>
          </div>
        </Panel>
      </ol>

      <Thread className={styles.threadEnd} />
      <div className={cx(styles.outro, shared.reveal)}>
        <Sticker name="sparkle" size={60} className={styles.stickerOutro} />
        <p className={styles.outroNote}>
          {t("outroStart")}
          <br />
          {t("outroEnd")}
        </p>
        <ButtonLink className={shared.cobaltLink} href="/sign-up">
          {tHero("start")}
        </ButtonLink>
      </div>
    </section>
  );
}
