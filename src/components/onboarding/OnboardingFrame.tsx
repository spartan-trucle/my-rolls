import Link from "next/link";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export interface OnboardingFrameProps {
  step: 1 | 2;
  skipHref: string;
  /** Main content — the search + chip columns (`/onboarding/bag`) or the empty shelf + radio options (`/onboarding/first-roll`). */
  children: ReactNode;
  /** The bottom hint + primary action, laid out per breakpoint by this frame (`OnboardBag`/`OnboardFirst`'s pinned-bottom / footer-bar). */
  footer: ReactNode;
}

/**
 * F1's shared chrome for `/onboarding/bag` and `/onboarding/first-roll`
 * (`OnboardBag`/`OnboardFirst` boards, no tab bar or app nav — these
 * routes live outside `(app)`): a step label + "Bỏ qua" + a 2-step
 * progress bar, then the page's own heading and content.
 *
 * One DOM tree, no JS layout switch: the step row and progress bar each
 * render twice (phone inline, desktop inside the 880px column with the
 * wordmark header above it), one copy hidden per breakpoint with
 * `lg:hidden` / `hidden lg:flex` — the same responsive-nav trick
 * `AuthLayout` uses, not a mistake.
 */
export function OnboardingFrame({ step, skipHref, children, footer }: OnboardingFrameProps) {
  const t = useTranslations("onboarding");
  const tCommon = useTranslations("common");
  const stepLabel = t("stepLabel", { step });
  const progressLabel = t("progressLabel", { step });
  const skipLabel = t("skip");
  const widthPercent = step === 1 ? 50 : 100;

  const stepRow = (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="font-sans text-label uppercase text-ink-muted">{stepLabel}</span>
        <Link href={skipHref} className="flex min-h-11 items-center font-sans text-body-sm font-medium text-cobalt">
          {skipLabel}
        </Link>
      </div>
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={2}
        aria-valuenow={step}
        aria-label={progressLabel}
        className="relative h-1 bg-line"
      >
        <span className="absolute inset-y-0 left-0 bg-cobalt" style={{ width: `${widthPercent}%` }} />
      </div>
    </div>
  );

  return (
    <div className="rc-paper flex min-h-dvh flex-col">
      <header className="hidden h-20 items-center justify-between border-b border-line px-[120px] lg:flex">
        <span className="font-display text-title font-semibold">{tCommon("appName")}</span>
        <ThemeToggle />
      </header>

      <div className="flex flex-grow flex-col gap-5 px-4 py-4 pb-6 lg:flex-grow-0 lg:items-center lg:px-[120px] lg:pt-12 lg:pb-0">
        <div className="lg:hidden">{stepRow}</div>

        <div className="flex flex-grow flex-col gap-7 lg:w-[880px] lg:flex-grow-0">
          <div className="hidden lg:block">{stepRow}</div>
          {children}
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-2.5 px-4 pb-6 lg:mt-0 lg:flex-row lg:items-center lg:justify-between lg:border-t lg:border-line lg:bg-paper-raised lg:px-[280px] lg:py-5">
        {footer}
      </div>
    </div>
  );
}
