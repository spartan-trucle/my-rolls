"use client";

import { useId, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Field, Icon } from "@/design-system";
import { cx } from "@/design-system/cx";
import { DialogCloseButton } from "@/components/overlay/DialogCloseButton";
import { addCustomCamera, addCustomLens, addCustomStock } from "@/features/catalogue/actions";
import styles from "./CustomEntryForm.module.css";

export type TCustomEntryKind = "stock" | "camera" | "lens";
type TFormat = "35mm" | "120";
type TCanisterColor = "gold" | "green" | "blue" | "mono" | "rose";

const FORMATS: TFormat[] = ["35mm", "120"];
const CANISTER_COLORS: TCanisterColor[] = ["gold", "green", "blue", "mono", "rose"];

// Maps each colour to its own vi.json key (t()'s keys must be literal, not
// built at runtime) — the board's "Loại film" chips (D1).
const CANISTER_COLOR_LABEL_KEYS = {
  gold: "typeGold",
  green: "typeGreen",
  blue: "typeBlue",
  mono: "typeMono",
  rose: "typeRose",
} as const satisfies Record<TCanisterColor, string>;

export interface ICustomEntryCreated {
  kind: TCustomEntryKind;
  refId: string;
  bagItemId: string;
}

export interface CustomEntryFormProps {
  /** "stock" (Film) by default, matching CataloguePicker's own default kind. */
  initialKind?: TCustomEntryKind;
  /** Prefills the name/model/lens-model field with what was typed in CataloguePicker's search box. */
  initialQuery?: string;
  onCreated: (entry: ICustomEntryCreated) => void;
  /** The heading row's close button (the board's `.xbtn`) — omitted when there's nothing for it to call. */
  onClose?: () => void;
  /** Same id as the host `ResponsiveDialog`'s `labelledBy`. Falls back to a generated id when rendered standalone. */
  titleId?: string;
  className?: string;
}

/**
 * D1 / CAT-2: "goes straight into the user's bag and is private to them" —
 * stock, camera or lens, one segmented form (`CustomEntry.dc.html`). Every
 * required field's error shows in `pin` in the same human voice the rest
 * of the design system uses (no error icons); a failed save shows one
 * generic message rather than guessing which field the server rejected,
 * since `addCustom*`'s result carries no per-field detail.
 */
export function CustomEntryForm({
  initialKind = "stock",
  initialQuery,
  onCreated,
  onClose,
  titleId,
  className,
}: CustomEntryFormProps) {
  const t = useTranslations("catalogue.customEntry");
  const generatedTitleId = useId();
  const headingId = titleId ?? generatedTitleId;

  const [kind, setKind] = useState<TCustomEntryKind>(initialKind);
  const [brand, setBrand] = useState("");
  const [name, setName] = useState(initialQuery ?? "");
  const [iso, setIso] = useState("");
  const [canisterColor, setCanisterColor] = useState<TCanisterColor>("gold");
  const [formats, setFormats] = useState<ReadonlySet<TFormat>>(new Set(["35mm"]));
  const [cameraFormat, setCameraFormat] = useState<TFormat>("35mm");
  const [focalLength, setFocalLength] = useState("");
  const [brandError, setBrandError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggleFormat(format: TFormat) {
    setFormats((prev) => {
      const next = new Set(prev);
      if (next.has(format)) next.delete(format);
      else next.add(format);
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedBrand = brand.trim();
    const trimmedName = name.trim();
    const nextBrandError = trimmedBrand === "" ? t("errorRequired") : null;
    const nextNameError = trimmedName === "" ? t("errorRequired") : null;
    setBrandError(nextBrandError);
    setNameError(nextNameError);
    if (nextBrandError || nextNameError) return;

    setSubmitting(true);
    setFormError(null);

    const result = await (kind === "stock"
      ? addCustomStock({
          brand: trimmedBrand,
          name: trimmedName,
          iso: iso.trim() === "" ? undefined : Number(iso),
          formats: formats.size > 0 ? Array.from(formats) : undefined,
          canisterColor,
        })
      : kind === "camera"
        ? addCustomCamera({ brand: trimmedBrand, model: trimmedName, format: cameraFormat })
        : addCustomLens({ brand: trimmedBrand, model: trimmedName, focalLength: focalLength.trim() || undefined }));

    setSubmitting(false);

    if (result.ok) {
      onCreated({ kind, refId: result.refId, bagItemId: result.bagItemId });
    } else {
      setFormError(t("errorGeneric"));
    }
  }

  const heading = t(kind === "stock" ? "stockHeading" : kind === "camera" ? "cameraHeading" : "lensHeading");
  const lead = t(kind === "stock" ? "stockLead" : kind === "camera" ? "cameraLead" : "lensLead");
  const saveLabel = t(kind === "stock" ? "saveStock" : kind === "camera" ? "saveCamera" : "saveLens");

  return (
    <form className={cx(styles.root, className)} onSubmit={handleSubmit}>
      <div className={styles.scroll}>
        <div className={styles.headingRow}>
          <div className={styles.headingBlock}>
            <h2 id={headingId} className={styles.heading}>
              {heading}
            </h2>
            <p className={styles.lead}>{lead}</p>
          </div>
          {onClose ? <DialogCloseButton onClose={onClose} /> : null}
        </div>

        <div className={styles.seg} role="group" aria-label={t("segmentLabel")}>
          <button type="button" aria-pressed={kind === "stock"} onClick={() => setKind("stock")}>
            {t("segmentStock")}
          </button>
          <button type="button" aria-pressed={kind === "camera"} onClick={() => setKind("camera")}>
            {t("segmentCamera")}
          </button>
          <button type="button" aria-pressed={kind === "lens"} onClick={() => setKind("lens")}>
            {t("segmentLens")}
          </button>
        </div>

        {kind === "stock" ? (
          <div className={styles.section}>
            <Field
              label={t("stockBrandLabel")}
              placeholder={t("stockBrandPlaceholder")}
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              error={brandError}
            />
            <Field
              label={t("stockNameLabel")}
              placeholder={t("stockNamePlaceholder")}
              value={name}
              onChange={(event) => setName(event.target.value)}
              error={nameError}
            />
            <Field
              label={t("stockIsoLabel")}
              hint={t("stockIsoHint")}
              mono
              inputMode="numeric"
              value={iso}
              onChange={(event) => setIso(event.target.value)}
            />
            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>{t("stockTypeLegend")}</legend>
              <div className={styles.chips}>
                {CANISTER_COLORS.map((color) => (
                  <label key={color} className={styles.chip} data-checked={canisterColor === color}>
                    <input
                      type="radio"
                      name="canisterColor"
                      className={styles.srOnly}
                      checked={canisterColor === color}
                      onChange={() => setCanisterColor(color)}
                    />
                    <span>{t(CANISTER_COLOR_LABEL_KEYS[color])}</span>
                  </label>
                ))}
              </div>
              <p className={styles.fieldHint}>{t("stockTypeHint")}</p>
            </fieldset>
            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>{t("stockFormatLegend")}</legend>
              <div className={styles.chips}>
                {FORMATS.map((format) => (
                  <label key={format} className={styles.chip} data-checked={formats.has(format)}>
                    <input
                      type="checkbox"
                      className={styles.srOnly}
                      checked={formats.has(format)}
                      onChange={() => toggleFormat(format)}
                    />
                    <span>{format}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        ) : null}

        {kind === "camera" ? (
          <div className={styles.section}>
            <Field
              label={t("cameraBrandLabel")}
              placeholder={t("cameraBrandPlaceholder")}
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              error={brandError}
            />
            <Field
              label={t("cameraModelLabel")}
              placeholder={t("cameraModelPlaceholder")}
              value={name}
              onChange={(event) => setName(event.target.value)}
              error={nameError}
            />
            <div className={styles.field}>
              <span className={styles.legend}>{t("cameraFormatLabel")}</span>
              <div className={styles.seg} role="group" aria-label={t("cameraFormatLabel")}>
                {FORMATS.map((format) => (
                  <button
                    key={format}
                    type="button"
                    aria-pressed={cameraFormat === format}
                    onClick={() => setCameraFormat(format)}
                  >
                    {format}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {kind === "lens" ? (
          <div className={styles.section}>
            <Field
              label={t("lensBrandLabel")}
              placeholder={t("lensBrandPlaceholder")}
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              error={brandError}
            />
            <Field
              label={t("lensModelLabel")}
              placeholder={t("lensModelPlaceholder")}
              value={name}
              onChange={(event) => setName(event.target.value)}
              error={nameError}
            />
            <Field
              label={t("lensFocalLabel")}
              hint={t("lensFocalHint")}
              mono
              placeholder={t("lensFocalPlaceholder")}
              value={focalLength}
              onChange={(event) => setFocalLength(event.target.value)}
            />
          </div>
        ) : null}

        <div className={styles.noteBox}>
          <Icon name="note" size={20} />
          <span>{t("privacyNote")}</span>
        </div>

        {formError ? (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        ) : null}
      </div>

      <div className={styles.footer}>
        <button type="submit" className={styles.save} disabled={submitting}>
          {saveLabel}
        </button>
      </div>
    </form>
  );
}
