import { useTranslations } from "next-intl";
import { RollCard, Scribble, Stamp, type RollCardProps } from "@/design-system";
import { cx } from "@/design-system/cx";
import shared from "./Landing.module.css";
import styles from "./Shelf.module.css";

type TSampleRoll = Omit<RollCardProps, "name" | "keepers" | "oops"> & {
  nameKey: "dalat" | "hoian" | "kitchen" | "expired";
  keepers: number;
  oops?: number;
};

/** Four sample rolls, one per stock family the canvas shows. Not links: there's nothing to open yet. */
const SAMPLE_ROLLS: TSampleRoll[] = [
  { nameKey: "dalat", stock: "gold", iso: 200, film: "Color 200", exposures: 36, camera: "Pentax K1000", date: "12–15.10.25", keepers: 5, oops: 3 },
  { nameKey: "hoian", stock: "green", iso: 400, film: "Color 400", exposures: 36, camera: "Olympus mju-II", date: "02.08.25", keepers: 7, oops: 1 },
  { nameKey: "kitchen", stock: "mono", iso: 400, film: "B&W 400", exposures: 24, camera: "Nikon FM2", date: "06.25", keepers: 4 },
  { nameKey: "expired", stock: "rose", iso: 100, film: "??? 100", exposures: 24, camera: "Pentax K1000", date: "04.25", keepers: 2, oops: 9 },
];

export function Shelf() {
  const t = useTranslations("landing.shelf");

  return (
    <section id="shelf" className={cx(shared.inner, styles.section)}>
      <div className={cx(styles.text, shared.reveal)}>
        <p className={shared.eyebrow}>{t("eyebrow")}</p>
        <h2 className={shared.title}>{t("title")}</h2>
        <p className={shared.body}>{t("body")}</p>
        <div className={styles.stamps}>
          <Stamp tone="keeper" icon="keeper" label={t("keepers", { count: 18 })}>
            18
          </Stamp>
          <Stamp tone="oops" icon="oops" label={t("oops", { count: 13 })}>
            13
          </Stamp>
          <Stamp icon="roll" label={t("rollsLabel", { count: 4 })}>
            {t("rolls", { count: 4 })}
          </Stamp>
        </div>
      </div>
      <div className={styles.shelf}>
        <ul className={styles.rolls} aria-label={t("listLabel")}>
          {SAMPLE_ROLLS.map(({ nameKey, keepers, oops, ...roll }) => (
            <li key={nameKey} className={shared.reveal}>
              <RollCard
                {...roll}
                name={t(nameKey)}
                keepers={{ count: keepers, label: t("keepers", { count: keepers }) }}
                oops={oops === undefined ? undefined : { count: oops, label: t("oops", { count: oops }) }}
              />
            </li>
          ))}
        </ul>
        <div className={styles.scribble}>
          <Scribble arrow="left" size="sm">
            {t("scribble")}
          </Scribble>
        </div>
      </div>
    </section>
  );
}
