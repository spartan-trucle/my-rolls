"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ResponsiveDialog } from "@/components/overlay/ResponsiveDialog";
import { Icon, Stamp } from "@/design-system";
import type { IRollMistake } from "../core";
import { MistakePicker } from "./MistakePicker";
import styles from "./OopsControl.module.css";

export interface OopsControlProps {
  rollId: string;
  frameId: string;
  framePosition: number;
  /** All of the roll's live mistakes; this shows the frame's and hands all to the picker. */
  mistakes: IRollMistake[];
}

/** FrameView's "Oops?" (NOTE-2): the frame's oops stamps and the picker. */
export function OopsControl({ rollId, frameId, framePosition, mistakes }: OopsControlProps) {
  const t = useTranslations("mistakes");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const mine = mistakes.filter((m) => m.frameId === frameId);

  return (
    <>
      <button type="button" className={styles.open} onClick={() => setOpen(true)}>
        <Icon name="oops" size={18} /> {t("open")}
      </button>
      {mine.length > 0 ? (
        <div className={styles.stamps}>
          {mine.map((m) => (
            <Stamp key={m.id} tone="oops" icon="oops" label={t(`types.${m.type}`)}>
              {t(`types.${m.type}`)}
            </Stamp>
          ))}
        </div>
      ) : null}
      <ResponsiveDialog open={open} onClose={() => setOpen(false)} labelledBy="mistake-picker-title">
        {open ? (
          <MistakePicker
            rollId={rollId}
            frameId={frameId}
            framePosition={framePosition}
            mistakes={mistakes}
            onDone={() => {
              setOpen(false);
              router.refresh();
            }}
          />
        ) : null}
      </ResponsiveDialog>
    </>
  );
}
