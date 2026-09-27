import { getSessionCookie } from "better-auth/cookies";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { AppShell } from "@/components/app-shell/AppShell";
import { Landing } from "@/components/landing/Landing";
import { ButtonLink, RollCard } from "@/design-system";
import { listRolls } from "@/features/rolls/actions";
import type { IRollEntry } from "@/features/rolls/core";
import { toRollCardProps } from "@/features/rolls/roll-card-mapper";
import { getAuth } from "@/lib/auth";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing");
  return { description: t("metaDescription") };
}

/** The first whitespace-separated token of a display name, for the "Kệ của {first name}" heading (D15's `Home` board). */
function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

function EmptyShelf({ t }: { t: ReturnType<typeof useTranslations<"home">> }) {
  return (
    <div className="flex flex-col items-start gap-4 border border-dashed border-line py-12">
      <div className="flex flex-col gap-2">
        <p className="font-display text-title">{t("emptyTitle")}</p>
        <p className="text-body-sm text-ink-muted">{t("emptyBody")}</p>
      </div>
      <ButtonLink href="/onboarding/first-roll" variant="primary">
        {t("emptyCta")}
      </ButtonLink>
    </div>
  );
}

/** N1: the "Cuộn #{number}" fallback for an unnamed roll, or `undefined` when there's no number to build it from (a pre-Round-2 row). */
function unnamedRollLabel(
  t: ReturnType<typeof useTranslations<"home">>,
  number: number | null | undefined,
): string | undefined {
  return number ? t("unnamedRoll", { number }) : undefined;
}

/** H1: a single column on the phone, 2 columns from 1024px up (`HomeWeb`'s shelf grid). */
function RollList({ rolls, t }: { rolls: IRollEntry[]; t: ReturnType<typeof useTranslations<"home">> }) {
  return (
    <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2 lg:gap-x-6 lg:gap-y-4">
      {rolls.map((roll) => (
        <RollCard key={roll.id} {...toRollCardProps(roll, { unnamedRollLabel: unnamedRollLabel(t, roll.number) })} />
      ))}
    </div>
  );
}

/**
 * Split from `Home` below so `useTranslations` only runs once React
 * actually renders this component — inside whatever provider wraps the
 * page — rather than eagerly inside `Home`'s own (async) function body,
 * before rendering has started.
 */
function HomeContent({ name, rolls }: { name: string; rolls: IRollEntry[] }) {
  const t = useTranslations("home");

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        {/* No logo: the name is set in Fraunces at weight 600 (matches AuthLayout's wordmark). */}
        <h1 className="font-display text-display-l font-semibold">{t("heading", { name: firstName(name) })}</h1>
        <p className="font-mono text-meta uppercase text-ink-muted">{t("countLine", { count: rolls.length })}</p>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="inline-flex border border-ink" role="group" aria-label={t("viewLabel")}>
          <button
            type="button"
            aria-pressed="true"
            className="min-h-10 min-w-[72px] bg-ink px-4 font-sans text-body-sm font-semibold text-paper"
          >
            {t("viewShelf")}
          </button>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="min-h-10 min-w-[72px] px-4 font-sans text-body-sm font-semibold text-ink-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("viewGrid")}
          </button>
        </div>
        {/* H2: "Mới nhất trước", beside the Kệ/Lưới toggle — after it on the
            phone (`Home`'s justify-between row), before it from 1024px up
            (`HomeWeb`'s `gap:16px` row, label first). */}
        <span className="text-body-sm text-ink-muted lg:order-first">{t("sortLabel")}</span>
      </div>
      {rolls.length > 0 ? <RollList rolls={rolls} t={t} /> : <EmptyShelf t={t} />}
    </div>
  );
}

/**
 * `/` is the landing page for visitors and the signed-in shelf (D15) for
 * everyone else — the real Home board, in an `AppShell`, listing
 * `listRolls()`'s rolls newest first as `RollCard`s.
 *
 * No session cookie at all means a visitor: the landing page renders
 * without building Better Auth or touching the database. With a cookie,
 * `proxy.ts`'s check is only optimistic (Stage D), so this reads the real
 * session server-side; a missing or stale one gets the landing page too.
 * (Redirecting it to `/sign-in` would loop: the proxy sends a request with
 * a session cookie from `/sign-in` back to `/`.)
 */
export default async function Home() {
  const requestHeaders = await headers();
  if (getSessionCookie(requestHeaders) === null) return <Landing />;

  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session) return <Landing />;

  const rolls = await listRolls();
  const initial = session.user.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <AppShell userInitial={initial}>
      <HomeContent name={session.user.name} rolls={rolls} />
    </AppShell>
  );
}
