import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";
import { FilmStrip, Scribble, type FilmFrame, type FilmStripLabels } from "@/design-system";
import { cx } from "@/design-system/cx";
import shared from "./Landing.module.css";
import styles from "./RollStrip.module.css";
import { ROLL_FRAMES, toFilmFrames } from "./samples";

interface MarqueeProps {
  frames: FilmFrame[];
  frameWidth: number;
  seconds: number;
  edgeText: string;
  labels: FilmStripLabels;
  className?: string;
}

/**
 * The strip twice in a row, sliding left by one strip's width and looping.
 * The copy is hidden from screen readers so the roll is read once.
 */
function Marquee({ frames, frameWidth, seconds, edgeText, labels, className }: MarqueeProps) {
  const strip = <FilmStrip frames={frames} frameWidth={frameWidth} edgeText={edgeText} labels={labels} />;
  return (
    <div className={cx(styles.marquee, className)}>
      <div className={styles.track} style={{ "--duration": `${seconds}s` } as CSSProperties}>
        {strip}
        <div aria-hidden="true">{strip}</div>
      </div>
    </div>
  );
}

function TypedLine({ text, className }: { text: string; className?: string }) {
  return (
    <p className={cx(styles.meta, className)}>
      <span className={styles.type} style={{ "--n": [...text].length } as CSSProperties}>
        {text}
      </span>
    </p>
  );
}

export function RollStrip() {
  const t = useTranslations("landing.roll");
  const tFrames = useTranslations("landing.frames");

  const labels = { strip: t("stripLabel"), keeper: tFrames("keeper"), oops: tFrames("oops") };
  const frames = toFilmFrames(ROLL_FRAMES, (photo, number) => (photo ? tFrames(photo) : tFrames("blank", { number })));
  const edgeText = t("edge");

  return (
    <section id="roll" className={styles.section} aria-label={t("label")}>
      <div className={cx(shared.inner, styles.head)}>
        <TypedLine text={t("metaShort")} className={shared.mobileOnly} />
        <TypedLine text={t("meta")} className={shared.desktopOnly} />
        <div className={styles.drawArrow}>
          <Scribble arrow="down" size="sm">
            {t("scribble")}
          </Scribble>
        </div>
      </div>
      <Marquee className={shared.mobileOnly} frames={frames} frameWidth={150} seconds={50} edgeText={edgeText} labels={labels} />
      <Marquee className={shared.desktopOnly} frames={frames} frameWidth={220} seconds={70} edgeText={edgeText} labels={labels} />
    </section>
  );
}
