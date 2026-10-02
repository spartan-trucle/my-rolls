import { getSessionCookie } from "better-auth/cookies";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { AppShell } from "@/components/app-shell/AppShell";
import { Landing } from "@/components/landing/Landing";
import { Shelf } from "@/features/canister/components/Shelf";
import { ViewSwitch } from "@/features/collection/components/ViewSwitch";
import { LIBRARY_VIEW_COOKIE, resolveLibraryView, type TLibraryView } from "@/features/collection/view-pref";
import { listRolls } from "@/features/rolls/actions";
import type { IRollEntry } from "@/features/rolls/core";
import { getAuth } from "@/lib/auth";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing");
  return { description: t("metaDescription") };
}

/** Library views built so far. Task 10 adds `grid`; until then the switch shows Lưới disabled and every view renders the shelf (Ruling R7). */
const READY_VIEWS: readonly TLibraryView[] = ["shelf"];
const VIEW_HREFS = { shelf: "/?view=shelf", grid: "/?view=grid" } as const;

/** The first whitespace-separated token of a display name, for the "Kệ của {first name}" heading (D15's `Home` board). */
function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/**
 * Split from `Home` below so `useTranslations` only runs once React
 * actually renders this component — inside whatever provider wraps the
 * page — rather than eagerly inside `Home`'s own (async) function body,
 * before rendering has started.
 */
function HomeContent({ name, rolls, view }: { name: string; rolls: IRollEntry[]; view: TLibraryView }) {
  const t = useTranslations("home");

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-5 lg:gap-10">
      {/*
       * H2 (full): phone stacks the heading block and the controls row
       * (`Shelf`'s two separate blocks). From 1024px up they share one row,
       * bottom-aligned — `ShelfWeb`'s header: heading + count line on the
       * left, sort label + Kệ/Lưới switch on the right.
       */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
        <div className="flex flex-col gap-1.5 lg:gap-2">
          {/* No logo: the name is set in Fraunces (the Shelf boards' heading). */}
          <h1 className="font-display text-display-mobile font-medium lg:text-display-xl">{t("heading", { name: firstName(name) })}</h1>
          <p className="font-mono text-meta uppercase text-ink-muted">{t("countLine", { count: rolls.length })}</p>
        </div>
        <div className="flex items-center justify-between gap-4">
          <ViewSwitch
            surface="library"
            current={view}
            hrefs={VIEW_HREFS}
            disabled={Object.keys(VIEW_HREFS).filter((v) => !READY_VIEWS.includes(v as TLibraryView))}
          />
          {/* H2: "Mới nhất trước", beside the Kệ/Lưới switch — after it on
              the phone (`Shelf`'s justify-between row), before it from
              1024px up (`ShelfWeb`'s `gap:16px` row, label first). */}
          <span className="text-body-sm-mobile text-ink-muted lg:order-first lg:text-body-sm">{t("sortLabel")}</span>
        </div>
      </div>
      <Shelf rolls={rolls} />
    </div>
  );
}

/**
 * `/` is the landing page for visitors and the signed-in shelf (D15) for
 * everyone else — the `Shelf` board, in an `AppShell`, listing
 * `listRolls()`'s rolls newest first as canisters (CAN-1). `?view=`, then
 * the remembered cookie, picks the view (COL-3, plan D7).
 *
 * No session cookie at all means a visitor: the landing page renders
 * without building Better Auth or touching the database. With a cookie,
 * `proxy.ts`'s check is only optimistic (Stage D), so this reads the real
 * session server-side; a missing or stale one gets the landing page too.
 * (Redirecting it to `/sign-in` would loop: the proxy sends a request with
 * a session cookie from `/sign-in` back to `/`.)
 */
export default async function Home({ searchParams }: PageProps<"/">) {
  const requestHeaders = await headers();
  if (getSessionCookie(requestHeaders) === null) return <Landing />;

  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session) return <Landing />;

  const [rolls, query, cookieStore] = await Promise.all([listRolls(), searchParams, cookies()]);
  const requested = resolveLibraryView(query.view, cookieStore.get(LIBRARY_VIEW_COOKIE)?.value);
  const view = READY_VIEWS.includes(requested) ? requested : "shelf";
  const initial = session.user.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <AppShell userInitial={initial}>
      <HomeContent name={session.user.name} rolls={rolls} view={view} />
    </AppShell>
  );
}
