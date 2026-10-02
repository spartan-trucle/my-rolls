"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useId, useRef, useState, type CSSProperties } from "react";
import { Button } from "@/design-system";
import { Canister } from "@/components/canister/Canister";
import { DialogCloseButton } from "@/components/overlay/DialogCloseButton";
import { ResponsiveDialog } from "@/components/overlay/ResponsiveDialog";
import { setCanisterAction } from "@/features/rolls/actions";
import type { IRollEntry } from "@/features/rolls/core";
import { CANISTER_PRESETS, canisterFill, isCanisterColor, type TCanisterPreset, type TCanisterStyle } from "../look";
import { toCanisterProps } from "../to-canister-props";
import styles from "./CanisterEditor.module.css";

type TDraft = { style: TCanisterStyle; color: string | null };

/** The board's default custom colour, shown before the owner has picked one. */
const DEFAULT_CUSTOM_HEX = "#7a5c9e";

/** R13: a colour picker's value, lowercased, or `null` when it isn't `#rrggbb` (the draft keeps its previous colour). */
export function pickerColor(value: string): string | null {
  const hex = value.toLowerCase();
  return hex.startsWith("#") && isCanisterColor(hex) ? hex : null;
}

function isPreset(value: string | null | undefined): value is TCanisterPreset {
  return value != null && (CANISTER_PRESETS as readonly string[]).includes(value);
}

function savedDraft(roll: IRollEntry): TDraft {
  return { style: roll.canisterStyle ?? "stock", color: roll.canisterColor };
}

/**
 * CAN-2, `CanisterEditor` / `CanisterEditorWeb` boards: the roll header's
 * canister opens a sheet (phone) or dialog (1024px+) to pick the look:
 * the film's colour, a drawn colour (8 presets or a free picker), or the
 * catalogue photo when the stock has one. Nothing is saved until "Lưu".
 */
export function CanisterEditor({ roll, save = setCanisterAction }: { roll: IRollEntry; save?: typeof setCanisterAction }) {
  const t = useTranslations("canisterEditor");
  const router = useRouter();
  const titleId = useId();
  const lookName = useId();
  const colourName = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<TDraft>(() => savedDraft(roll));
  const [customHex, setCustomHex] = useState(DEFAULT_CUSTOM_HEX);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const fallback = t("unnamedRoll", { number: roll.number ?? 0 });
  const label = roll.name ?? fallback;
  const preview = toCanisterProps({ ...roll, canisterStyle: draft.style, canisterColor: draft.color }, fallback);
  const hasPhoto = Boolean(roll.stock?.canisterPhotoUrl);
  const stockColor = roll.stock?.canisterColor ?? null;
  const filmName = roll.stock ? `${roll.stock.brand} ${roll.stock.name}` : null;
  const drawnColor = draft.style === "drawn" ? draft.color : null;
  const customOn = drawnColor !== null && drawnColor.startsWith("#");

  function openEditor() {
    // R14: every opening starts from the roll's saved look.
    const saved = savedDraft(roll);
    setDraft(saved);
    setCustomHex(saved.color?.startsWith("#") && isCanisterColor(saved.color) ? saved.color : DEFAULT_CUSTOM_HEX);
    setError(false);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function pickLook(style: TCanisterStyle) {
    if (style !== "drawn") return setDraft((d) => ({ ...d, style }));
    // "Tự vẽ" with nothing picked yet starts from the colour on show.
    setDraft((d) => ({ style: "drawn", color: d.color !== null && isCanisterColor(d.color) ? d.color : isPreset(stockColor) ? stockColor : "gold" }));
  }

  function pickHex(value: string) {
    const hex = pickerColor(value);
    if (hex === null) return;
    setCustomHex(hex);
    setDraft({ style: "drawn", color: hex });
  }

  async function onSave() {
    if (saving) return;
    const input =
      draft.style === "drawn" && draft.color !== null && isCanisterColor(draft.color)
        ? { rollId: roll.id, style: "drawn" as const, color: draft.color }
        : { rollId: roll.id, style: draft.style === "drawn" ? ("stock" as const) : draft.style };
    setSaving(true);
    const result = await save(input);
    setSaving(false);
    if (!result.ok) return setError(true);
    setError(false);
    close();
    router.refresh();
  }

  const stockHint = filmName
    ? isPreset(stockColor)
      ? t("stockHint", { film: filmName, colour: t(`presets.${stockColor}`) })
      : filmName
    : null;
  const looks: Array<{ id: TCanisterStyle; title: string; hint: string | null }> = [
    { id: "stock", title: t("reset"), hint: stockHint },
    { id: "drawn", title: t("drawn"), hint: t("drawnHint") },
    ...(hasPhoto ? [{ id: "photo" as const, title: t("photo"), hint: t("photoHint") }] : []),
  ];

  return (
    <>
      <button ref={triggerRef} type="button" className={styles.trigger} onClick={openEditor} aria-label={t("open")}>
        <Canister {...toCanisterProps(roll, fallback)} className={styles.triggerCanister} />
        <span className={styles.triggerText}>{t("openShort")}</span>
      </button>

      <ResponsiveDialog open={open} onClose={close} labelledBy={titleId} className={styles.dialog}>
        {open ? (
          <div className={styles.panel}>
            <div className={styles.grab} aria-hidden="true" />
            <div className={styles.head}>
              <h2 id={titleId} className={styles.title}>
                {t("title")}
              </h2>
              <DialogCloseButton onClose={close} />
            </div>

            <div className={styles.body}>
              <div className={styles.top}>
                <div className={styles.previewColumn}>
                  <div
                    className={styles.preview}
                    data-testid="canister-preview"
                    role="img"
                    aria-label={t("preview", { name: label })}
                    style={{ "--rc-stock": canisterFill(preview.color) } as CSSProperties}
                  >
                    <Canister {...preview} className={styles.previewCanister} />
                  </div>
                  <div className={styles.ledge} aria-hidden="true" />
                  {filmName ? <span className={styles.film}>{filmName}</span> : null}
                  {preview.sticker ? <span className={styles.sticker}>{preview.sticker}</span> : null}
                </div>

                <fieldset className={styles.fieldset}>
                  <legend className={styles.legend}>{t("look")}</legend>
                  <div className={styles.looks}>
                    {looks.map((look) => (
                      <label key={look.id} className={styles.look}>
                        <input
                          type="radio"
                          className={styles.sr}
                          name={lookName}
                          value={look.id}
                          checked={draft.style === look.id}
                          onChange={() => pickLook(look.id)}
                          aria-labelledby={`${lookName}-${look.id}`}
                          aria-describedby={look.hint ? `${lookName}-${look.id}-hint` : undefined}
                        />
                        <span className={styles.dot} aria-hidden="true" />
                        <span className={styles.lookText}>
                          <span id={`${lookName}-${look.id}`} className={styles.lookTitle}>
                            {look.title}
                          </span>
                          {look.hint ? (
                            <span id={`${lookName}-${look.id}-hint`} className={styles.lookHint}>
                              {look.hint}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              <fieldset className={styles.fieldset}>
                <legend className={styles.legend}>{t("colours")}</legend>
                <div className={styles.swatches}>
                  {CANISTER_PRESETS.map((slug) => (
                    <label key={slug} className={styles.swatch}>
                      <input
                        type="radio"
                        className={styles.sr}
                        name={colourName}
                        value={slug}
                        checked={drawnColor === slug}
                        onChange={() => setDraft({ style: "drawn", color: slug })}
                      />
                      <span className={styles.chip} style={{ backgroundColor: canisterFill(slug) }} aria-hidden="true">
                        <Tick />
                      </span>
                      <span>{t(`presets.${slug}`)}</span>
                    </label>
                  ))}
                </div>
                <div className={styles.customRow}>
                  <label className={`${styles.swatch} ${styles.customSwatch}`}>
                    <input
                      type="radio"
                      className={styles.sr}
                      name={colourName}
                      value="custom"
                      checked={customOn}
                      onChange={() => setDraft({ style: "drawn", color: customHex })}
                    />
                    <span className={styles.chip} style={{ backgroundColor: canisterFill(customHex) }} aria-hidden="true">
                      <Tick />
                    </span>
                    <span>{t("custom")}</span>
                  </label>
                  <input
                    type="color"
                    className={styles.picker}
                    value={customHex}
                    onChange={(event) => pickHex(event.currentTarget.value)}
                    aria-label={t("customPicker")}
                  />
                  <span className={styles.hex}>{customHex.toUpperCase()}</span>
                </div>
              </fieldset>

              <p className={styles.hint}>
                {t("labelHint")}{" "}
                <Link href={`/rolls/${roll.id}/edit`} className={styles.rename}>
                  {t("rename")}
                </Link>
              </p>
            </div>

            <div className={styles.foot}>
              {error ? (
                <p className={styles.error} role="alert">
                  {t("saveFailed")}
                </p>
              ) : null}
              <div className={styles.actions}>
                <Button className={styles.cancel} onClick={close} disabled={saving}>
                  {t("cancel")}
                </Button>
                <Button variant="primary" className={styles.save} onClick={onSave} disabled={saving}>
                  {t("save")}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </ResponsiveDialog>
    </>
  );
}

function Tick() {
  return (
    <span className={styles.tick}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </span>
  );
}
