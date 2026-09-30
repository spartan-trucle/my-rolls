"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, Icon, Scribble, Stamp } from "@/design-system";
import { OnboardingFrame } from "@/components/onboarding/OnboardingFrame";

type TFirstRollMode = "past" | "current";

const MODE_TARGET: Record<TFirstRollMode, string> = {
  past: "/rolls/new?mode=past",
  current: "/rolls/new",
};

/**
 * F1 · `/onboarding/first-roll`'s interactive half (`OnboardFirst` board):
 * the empty-shelf illustration and the two mode options, "past" picked by
 * default like the board. "Bắt đầu" navigates to whichever mode is
 * selected — D3 (`/rolls/new`) builds the actual destinations; this route
 * only links to them.
 */
export function OnboardFirstContent() {
  const t = useTranslations("onboarding.firstRoll");
  const router = useRouter();
  const [mode, setMode] = useState<TFirstRollMode>("past");

  function handleStart() {
    router.push(MODE_TARGET[mode]);
  }

  return (
    <OnboardingFrame
      step={2}
      footer={
        <>
          <Link
            href="/"
            className="order-2 flex min-h-11 items-center justify-center font-sans text-body-sm font-medium text-cobalt lg:order-1"
          >
            {t("later")}
          </Link>
          <Button variant="primary" onClick={handleStart} className="order-1 lg:order-2 lg:w-auto lg:px-8">
            {t("start")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-display-l font-medium">{t("title")}</h1>
        <p className="text-body-sm text-ink-muted">{t("subtitle")}</p>
      </div>

      <div className="flex flex-col gap-5 pt-5">
        <div className="flex items-end gap-5 px-3">
          <div className="flex h-[72px] w-11 items-center justify-center rounded-sm border-2 border-dashed border-line-strong font-display text-title text-ink-muted">
            ?
          </div>
          <Scribble arrow="left" size="sm">
            {t("emptyShelfNote")}
          </Scribble>
        </div>
        <div className="h-2.5 bg-scrap-edge" />
        <div className="h-1.5 bg-line" />
      </div>

      <fieldset className="m-0 flex flex-col gap-3 border-0 p-0 lg:grid lg:grid-cols-2 lg:gap-4">
        <legend className="sr-only">{t("modeLegend")}</legend>

        <label
          className={`relative grid cursor-pointer grid-cols-[44px_1fr_22px] items-center gap-3.5 border p-4 ${
            mode === "past" ? "border-cobalt bg-cobalt-soft" : "border-line bg-paper-raised"
          }`}
        >
          <input
            type="radio"
            name="first-roll-mode"
            value="past"
            checked={mode === "past"}
            onChange={() => setMode("past")}
            className="sr-only"
          />
          <span className="flex h-11 w-11 items-center justify-center bg-paper text-cobalt">
            <Icon name="upload" size={20} />
          </span>
          <span className="flex flex-col gap-1">
            <span className="flex flex-wrap items-center gap-2 font-sans text-body font-semibold">
              {t("modePastLabel")}
              <Stamp tone="keeper">{t("modePastRecommended")}</Stamp>
            </span>
            <span className="text-body-sm text-ink-muted">{t("modePastBody")}</span>
          </span>
          <span
            aria-hidden="true"
            className={`h-5 w-5 rounded-full border box-border ${mode === "past" ? "border-[6px] border-cobalt" : "border-[1.5px] border-line-strong"}`}
          />
        </label>

        <label
          className={`relative grid cursor-pointer grid-cols-[44px_1fr_22px] items-center gap-3.5 border p-4 ${
            mode === "current" ? "border-cobalt bg-cobalt-soft" : "border-line bg-paper-raised"
          }`}
        >
          <input
            type="radio"
            name="first-roll-mode"
            value="current"
            checked={mode === "current"}
            onChange={() => setMode("current")}
            className="sr-only"
          />
          <span className="flex h-11 w-11 items-center justify-center bg-paper text-cobalt">
            <Icon name="roll" size={20} />
          </span>
          <span className="flex flex-col gap-1">
            <span className="font-sans text-body font-semibold">{t("modeCurrentLabel")}</span>
            <span className="text-body-sm text-ink-muted">{t("modeCurrentBody")}</span>
          </span>
          <span
            aria-hidden="true"
            className={`h-5 w-5 rounded-full border box-border ${mode === "current" ? "border-[6px] border-cobalt" : "border-[1.5px] border-line-strong"}`}
          />
        </label>
      </fieldset>
    </OnboardingFrame>
  );
}
