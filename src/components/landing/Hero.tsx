import Image from "next/image";
import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";
import { ButtonLink, FilmStrip, Icon, Print, Scribble } from "@/design-system";
import { cx } from "@/design-system/cx";
import { Canister } from "./Canister";
import styles from "./Hero.module.css";
import shared from "./Landing.module.css";
import { CAMERA_SRC, HERO_FRAMES, PHOTOS, toFilmFrames } from "./samples";
import { Sticker } from "./Sticker";

/** Animation delay (and, for drops, the starting tilt) as CSS variables. */
function motion(delay: number, from?: number): CSSProperties {
  return { "--d": `${delay}s`, ...(from === undefined ? {} : { "--from": `${from}deg` }) } as CSSProperties;
}

export function Hero() {
  const t = useTranslations("landing.hero");
  const tCanister = useTranslations("landing.canister");
  const tFrames = useTranslations("landing.frames");
  const appName = useTranslations("common")("appName");

  const stripLabels = { strip: t("stripLabel"), keeper: tFrames("keeper"), oops: tFrames("oops") };
  const frames = toFilmFrames(HERO_FRAMES, (photo, number) => (photo ? tFrames(photo) : tFrames("blank", { number })));
  const canister = { iso: 200, family: tCanister("family"), exposures: tCanister("exposures"), label: t("canisterAlt") };
  const print = { src: PHOTOS.paperLanterns, alt: t("printAlt"), caption: t("printCaption"), date: "09.08.25" };

  return (
    <section id="top" className={cx(shared.inner, styles.hero)}>
      <div className={styles.text}>
        <p className={cx(styles.eyebrow, styles.rise)} style={motion(0.05)}>
          <Icon name="roll" size={16} />
          {t("eyebrow")}
        </p>
        <h1 className={cx(styles.headline, styles.rise)} style={motion(0.15)}>
          {t("titleStart")}
          <br />
          {t.rich("titleEnd", {
            oops: (chunks) => (
              <span className={styles.oops}>
                {chunks}
                <svg className={styles.circle} viewBox="0 0 260 120" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M36 70 C 24 30, 120 8, 206 20 C 256 28, 262 86, 178 104 C 104 118, 18 102, 22 64 C 26 36, 80 16, 138 14" />
                </svg>
              </span>
            ),
          })}
        </h1>
        <p className={cx(styles.lead, styles.rise)} style={motion(0.3)}>
          {t("lead")}
        </p>
        <p className={cx(styles.body, styles.rise)} style={motion(0.38)}>
          {t("body", { appName })}
        </p>
      </div>

      <div className={styles.art}>
        {/* Phone composition (Mobile-vi board), also used up to 1199px. */}
        <div className={cx(styles.phoneArt, shared.mobileOnly)}>
          <div className={styles.phoneStrip}>
            <div className={styles.pull}>
              <FilmStrip frames={frames.slice(0, 3)} frameWidth={120} edgeText="COLOR 200 · CUỘN 14" labels={stripLabels} />
            </div>
          </div>
          <div className={cx(styles.phoneCanister, styles.drop)} style={motion(0.35, -10)}>
            <div className={styles.tug}>
              <Canister {...canister} width={110} />
            </div>
          </div>
          <div className={cx(styles.phoneCamera, styles.rise)} style={motion(1)}>
            <Image className={shared.object} src={CAMERA_SRC} alt={t("cameraAlt")} width={184} height={140} loading="eager" />
          </div>
          <div className={cx(styles.phonePrint, styles.drop)} style={motion(1.8, 8)}>
            {/* No date at this width: it would squeeze the caption to a word per line. */}
            <Print {...print} date={undefined} format="instant" aspect="3/4" width={140} attach="pin" tilt="right" />
          </div>
          <Sticker name="butterfly" size={72} tilt={12} delay={0.5} className={styles.phoneButterfly} />
          <Sticker name="bang" size={56} tilt={10} delay={1} className={styles.phoneBang} />
        </div>

        {/* Desktop composition (Main-vi board). */}
        <div className={cx(styles.deskArt, shared.desktopOnly)}>
          <div className={cx(styles.ticket, styles.rise)} style={motion(1.2)} aria-hidden="true">
            <span className={styles.tape} />
            <p className={styles.ticketLab}>{t("ticketLab")}</p>
            <p className={styles.ticketRoll}>{t("ticketRoll")}</p>
            <p className={styles.ticketLine}>{t("ticketProcess")}</p>
            <p className={styles.ticketDone}>{t("ticketDone")}</p>
          </div>
          <div className={cx(styles.scribble, styles.rise, styles.drawArrow)} style={motion(1.6)}>
            <Scribble arrow="down" size="sm">
              {t("scribble")}
            </Scribble>
          </div>
          <div className={styles.deskStrip}>
            <div className={styles.pull}>
              <FilmStrip frames={frames} frameWidth={170} edgeText="COLOR 200 · CUỘN 14" labels={stripLabels} />
            </div>
          </div>
          <div className={styles.deskCanister}>
            <div className={styles.drop} style={motion(0.1, -10)}>
              <div className={styles.tug}>
                <Canister {...canister} width={138} />
              </div>
            </div>
          </div>
          <div className={styles.deskCamera}>
            <div className={styles.rise} style={motion(0.9)}>
              <Image className={shared.object} src={CAMERA_SRC} alt={t("cameraAlt")} width={300} height={228} loading="eager" />
            </div>
          </div>
          <div className={styles.deskPrint}>
            <div className={styles.drop} style={motion(1.9, 8)}>
              <Print {...print} format="instant" aspect="3/4" width={176} attach="pin" tilt="right" />
            </div>
          </div>
          <Sticker name="sparkle" size={138} tilt={-32} delay={1.1} className={styles.deskSparkle} />
          <Sticker name="heart" size={94} tilt={9} delay={0.9} className={styles.deskHeart} />
          <Sticker name="butterfly" size={96} tilt={12} className={styles.deskButterfly} />
          <Sticker name="bang" size={114} tilt={10} delay={0.6} className={styles.deskBang} />
        </div>
      </div>

      <div className={styles.actions}>
        <div className={cx(styles.buttons, styles.rise)} style={motion(0.45)}>
          <ButtonLink variant="primary" icon="upload" href="/sign-up">
            {t("start")}
          </ButtonLink>
          <ButtonLink variant="quiet" href="#roll">
            {t("sample")}
          </ButtonLink>
        </div>
        <p className={cx(styles.meta, styles.rise)} style={motion(0.6)}>
          {t("meta")}
        </p>
      </div>

      <Sticker name="sparkle" size={48} className={cx(styles.phoneSparkle, shared.mobileOnly)} />
      <Sticker name="reel" size={96} tilt={-8} delay={0.3} className={cx(styles.deskReel, shared.desktopOnly)} />
    </section>
  );
}
