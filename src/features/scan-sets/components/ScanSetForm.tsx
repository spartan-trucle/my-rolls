"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { LabAddForm } from "@/features/labs/components/LabAddForm";
import { LabPicker, type ILabPick } from "@/features/labs/components/LabPicker";
import { updateScanSetAction } from "../actions";
import type { IScanSetSummary } from "../core";
import {
  RESOLUTION_CHOICES,
  fromDateInput,
  parsePriceVnd,
  parsePushPullThirds,
  resolutionChoiceFor,
  thirdsToLabel,
  toDateInput,
  type TResolutionChoice,
} from "./fields";
import styles from "./ScanSetForm.module.css";

const PROCESSES = ["c41", "e6", "bw", "ecn2"] as const;
const FILE_FORMATS = ["JPEG", "TIFF"] as const;

export interface ScanSetFormProps {
  scanSet: IScanSetSummary;
  rollLabel: string;
  /** The roll's computed push/pull, in thirds, to prefill (D8). */
  rollPushPullThirds: number | null;
  onSaved: () => void;
  /** For tests; defaults to now. */
  today?: Date;
}

type TView = "form" | "pick" | "add";

/** The `ScanSetForm` board (LAB-3): lab and branch, received date, optional details folded. */
export function ScanSetForm({ scanSet, rollLabel, rollPushPullThirds, onSaved, today }: ScanSetFormProps) {
  const t = useTranslations("scanSets");
  const id = useId();
  const [view, setView] = useState<TView>("form");
  const [lab, setLab] = useState<ILabPick | null>(
    scanSet.labId
      ? {
          labId: scanSet.labId,
          branchId: scanSet.labBranchId,
          name: scanSet.labName ?? "",
          place: [scanSet.branchName, scanSet.branchCity].filter(Boolean).join(", "),
        }
      : null,
  );
  const [receivedAt, setReceivedAt] = useState(toDateInput(scanSet.receivedAt ?? today ?? new Date()));
  const [open, setOpen] = useState(false);
  const [droppedAt, setDroppedAt] = useState(scanSet.droppedAt ? toDateInput(scanSet.droppedAt) : "");
  const [process, setProcess] = useState(scanSet.process);
  const [pushPull, setPushPull] = useState(thirdsToLabel(scanSet.pushPullThirds ?? rollPushPullThirds));
  const [price, setPrice] = useState(scanSet.priceVnd != null ? scanSet.priceVnd.toLocaleString("vi-VN") : "");
  const [scanner, setScanner] = useState(scanSet.scanner ?? "");
  const [resolution, setResolution] = useState<TResolutionChoice | null>(resolutionChoiceFor(scanSet.resolutionPx));
  const [fileFormat, setFileFormat] = useState(scanSet.fileFormat);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (view === "pick") {
    return (
      <LabPicker
        heading={t("pickerHeading", { roll: rollLabel })}
        onPick={(pick) => {
          setLab(pick);
          setView("form");
        }}
        onAddNew={() => setView("add")}
      />
    );
  }

  if (view === "add") {
    return (
      <LabAddForm
        onBack={() => setView("pick")}
        onCreated={({ lab: created, branch }) => {
          setLab({
            labId: created.id,
            branchId: branch.id,
            name: created.name,
            place: [branch.district, branch.areaHint, branch.city].filter(Boolean).join(", "),
          });
          setView("form");
        }}
      />
    );
  }

  const save = async () => {
    setError(null);
    const pushPullThirds = parsePushPullThirds(pushPull);
    if (pushPullThirds === undefined) return setError(t("errors.invalid_push_pull"));
    const priceVnd = parsePriceVnd(price);
    if (priceVnd === undefined) return setError(t("errors.invalid_price"));

    setSaving(true);
    const result = await updateScanSetAction({
      scanSetId: scanSet.id,
      labId: lab?.labId,
      labBranchId: lab ? lab.branchId : undefined,
      receivedAt: fromDateInput(receivedAt),
      droppedAt: fromDateInput(droppedAt),
      process: process ?? null,
      pushPullThirds,
      scanner: scanner.trim() || null,
      resolutionPx: resolution ? RESOLUTION_CHOICES.find((c) => c.key === resolution)!.px : null,
      fileFormat: fileFormat ?? null,
      priceVnd,
    }).catch(() => ({ ok: false as const, error: "generic" as const }));
    setSaving(false);
    if (result.ok) onSaved();
    else setError(t(`errors.${result.error}` as "errors.generic"));
  };

  return (
    <div className={styles.form}>
      <div>
        <h2 id="scan-set-form-title" className={styles.title}>
          {t("title")}
        </h2>
        <p className={styles.lead}>{t("lead")}</p>
      </div>

      <fieldset className={styles.fieldset}>
        <legend className={styles.label}>
          {t("labLegend")} <span className={styles.req}>{t("required")}</span>
        </legend>
        <button type="button" className={styles.labRow} onClick={() => setView("pick")} aria-label={lab ? `${lab.name}, ${t("change")}` : t("chooseLab")}>
          <span className={styles.labText}>
            <span>{lab ? lab.name : t("noLabYet")}</span>
            {lab?.place ? <span className={styles.mono}>{lab.place.toUpperCase()}</span> : null}
          </span>
          <span className={styles.change}>{lab ? t("change") : t("chooseLab")}</span>
        </button>
      </fieldset>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${id}-rv`}>
          {t("receivedAt")} <span className={styles.req}>{t("required")}</span>
        </label>
        <input id={`${id}-rv`} className={styles.input} type="date" value={receivedAt} onChange={(e) => setReceivedAt(e.target.value)} />
        <span className={styles.hint}>{t("receivedHint")}</span>
      </div>

      <button type="button" className={styles.details} aria-expanded={open} aria-controls={`${id}-det`} onClick={() => setOpen(!open)}>
        <span className={styles.detailsTitle}>{t("details")}</span>
        <span className={styles.hint}>{t("detailsHint")}</span>
      </button>

      {open ? (
        <div id={`${id}-det`} className={styles.detailsBody}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor={`${id}-dp`}>
              {t("droppedAt")}
            </label>
            <input id={`${id}-dp`} className={styles.input} type="date" value={droppedAt} onChange={(e) => setDroppedAt(e.target.value)} />
          </div>

          <fieldset className={styles.fieldset}>
            <legend className={styles.label}>{t("process")}</legend>
            <div className={styles.chips}>
              {PROCESSES.map((p) => (
                <label key={p} className={styles.chip}>
                  <input type="radio" className={styles.sr} name={`${id}-pr`} checked={process === p} onChange={() => setProcess(p)} />
                  <span>{t(`processes.${p}`)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className={styles.two}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor={`${id}-pp`}>
                {t("pushPull")}
              </label>
              <input id={`${id}-pp`} className={styles.input} value={pushPull} onChange={(e) => setPushPull(e.target.value)} />
              {rollPushPullThirds !== null ? <span className={styles.hint}>{t("pushPullHint")}</span> : null}
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor={`${id}-pc`}>
                {t("price")}
              </label>
              <input id={`${id}-pc`} className={styles.input} inputMode="numeric" placeholder="90.000" value={price} onChange={(e) => setPrice(e.target.value)} />
              <span className={styles.hint}>{t("priceHint")}</span>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor={`${id}-sc`}>
              {t("scanner")}
            </label>
            <input id={`${id}-sc`} className={styles.inputSans} placeholder={t("scannerPlaceholder")} value={scanner} onChange={(e) => setScanner(e.target.value)} />
          </div>

          <fieldset className={styles.fieldset}>
            <legend className={styles.label}>{t("resolution")}</legend>
            <div className={styles.chips}>
              {RESOLUTION_CHOICES.map((c) => (
                <label key={c.key} className={styles.chip}>
                  <input type="radio" className={styles.sr} name={`${id}-rs`} checked={resolution === c.key} onChange={() => setResolution(c.key)} />
                  <span>{t(`resolutions.${c.key}`)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.fieldset}>
            <legend className={styles.label}>{t("fileFormat")}</legend>
            <div className={styles.chips}>
              {FILE_FORMATS.map((f) => (
                <label key={f} className={styles.chip}>
                  <input type="radio" className={styles.sr} name={`${id}-ff`} checked={fileFormat === f} onChange={() => setFileFormat(f)} />
                  <span>{f}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      ) : null}

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <button type="button" className={styles.primary} onClick={save} disabled={saving}>
        {saving ? t("saving") : t("save")}
      </button>
    </div>
  );
}
