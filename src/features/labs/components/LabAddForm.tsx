"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button, Field } from "@/design-system";
import { cx } from "@/design-system/cx";
import { addLabAction } from "@/features/labs/actions";
import { LAB_SERVICES, type TLabService } from "@/features/labs/constants";
import type { TLabBranchRow, TLabRow } from "@/features/labs/core";
import styles from "./LabAddForm.module.css";

const CITY_CHIPS = ["TP.HCM", "Hà Nội", "Đà Lạt", "Đà Nẵng"] as const;
/** Not a real city — picking it swaps the chip row for a free-text field. */
const OTHER_CITY = "__other__";

export interface LabAddFormProps {
  onCreated: (result: { lab: TLabRow; branch: TLabBranchRow }) => void;
  onBack?: () => void;
  className?: string;
}

/** Maps the zod `issue.message` codes from `addLabCore` to `pin` copy in a human voice. */
function fieldErrorMessage(code: string, t: ReturnType<typeof useTranslations>): string {
  if (code === "name_required") return t("errorNameRequired");
  if (code === "city_required") return t("errorCityRequired");
  if (code === "invalid_link_url") return t("errorLinkInvalid");
  return t("errorGeneric");
}

/**
 * F2: `LabAddForm` from the `LabAdd` / `LabAddWeb` boards, LAB-2. Every
 * lab this creates is private (design finding 2: the "Gửi lên danh bạ lab
 * chung" toggle is CAT-3, v1.1b, left out). `district` is optional and
 * free text; `areaHint` isn't collected here (only the seed data and the
 * older Q./quận labels use it).
 */
export function LabAddForm({ onCreated, onBack, className }: LabAddFormProps) {
  const t = useTranslations("labs.add");
  const districtId = useId();
  const cityId = useId();
  const mailId = useId();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState<string>(CITY_CHIPS[0]);
  const [otherCity, setOtherCity] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [services, setServices] = useState<TLabService[]>([]);
  const [acceptsMail, setAcceptsMail] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function toggleService(service: TLabService) {
    setServices((current) =>
      current.includes(service) ? current.filter((item) => item !== service) : [...current, service],
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGeneralError(undefined);
    setFieldErrors({});

    const resolvedCity = city === OTHER_CITY ? otherCity.trim() : city;

    startTransition(async () => {
      const result = await addLabAction({
        name,
        city: resolvedCity,
        address: address.trim() || undefined,
        district: district.trim() || undefined,
        linkUrl: linkUrl.trim() || undefined,
        services,
        acceptsMail,
      });

      if (result.ok) {
        onCreated({ lab: result.lab, branch: result.branch });
        return;
      }

      if (result.error.type === "unauthenticated") {
        setGeneralError(t("errorUnauthenticated"));
        return;
      }

      const nextFieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        nextFieldErrors[issue.path] = fieldErrorMessage(issue.message, t);
      }
      setFieldErrors(nextFieldErrors);
    });
  }

  return (
    <form className={cx("flex flex-col gap-4", className)} onSubmit={handleSubmit}>
      {onBack ? (
        <button type="button" className={styles.back} onClick={onBack}>
          {t("back")}
        </button>
      ) : null}

      <div className="flex flex-col gap-1">
        <h1 className="font-display text-display-l text-balance">{t("title")}</h1>
        <p className="text-body-sm text-ink-muted">{t("subtitle")}</p>
      </div>

      <div className={styles.grid2}>
        <Field
          label={t("nameLabel")}
          placeholder={t("namePlaceholder")}
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={fieldErrors.name}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-label uppercase text-ink-muted" htmlFor={cityId}>
            {t("cityLabel")}
          </label>
          <div className={styles.chipRow}>
            {CITY_CHIPS.map((option) => (
              <button
                key={option}
                type="button"
                className={styles.chip}
                aria-pressed={city === option}
                onClick={() => setCity(option)}
              >
                {option}
              </button>
            ))}
            <button
              type="button"
              className={styles.chip}
              aria-pressed={city === OTHER_CITY}
              onClick={() => setCity(OTHER_CITY)}
            >
              {t("cityOther")}
            </button>
          </div>
          {city === OTHER_CITY ? (
            <Field
              id={cityId}
              label={t("cityOtherPlaceholder")}
              placeholder={t("cityOtherPlaceholder")}
              value={otherCity}
              onChange={(event) => setOtherCity(event.target.value)}
            />

          ) : null}
          {fieldErrors.city ? <span className={styles.generalError}>{fieldErrors.city}</span> : null}
        </div>

        <div className={styles.span2}>
          <Field
            label={t("addressLabel")}
            placeholder={t("addressPlaceholder")}
            value={address}
            onChange={(event) => setAddress(event.target.value)}
          />
        </div>

        <Field
          id={districtId}
          label={t("districtLabel")}
          placeholder={t("districtPlaceholder")}
          value={district}
          onChange={(event) => setDistrict(event.target.value)}
        />

        <div className={styles.span2}>
          <Field
            label={t("linkLabel")}
            placeholder={t("linkPlaceholder")}
            hint={fieldErrors.linkUrl ? undefined : t("linkHint")}
            error={fieldErrors.linkUrl}
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-label uppercase text-ink-muted">{t("servicesLabel")}</span>
        <div className={styles.chipRow}>
          {LAB_SERVICES.map((service) => (
            <button
              key={service}
              type="button"
              className={styles.chip}
              aria-pressed={services.includes(service)}
              onClick={() => toggleService(service)}
            >
              {service}
            </button>
          ))}
        </div>
      </div>

      <label className={styles.switchRow} htmlFor={mailId}>
        <input
          id={mailId}
          type="checkbox"
          className={styles.switch}
          checked={acceptsMail}
          onChange={(event) => setAcceptsMail(event.target.checked)}
        />
        <span className="text-body">{t("acceptsMailLabel")}</span>
      </label>

      {generalError ? <span className={styles.generalError}>{generalError}</span> : null}

      <Button type="submit" variant="primary" className="w-full" disabled={pending}>
        {pending ? t("savingButton") : t("saveButton")}
      </Button>
    </form>
  );
}
