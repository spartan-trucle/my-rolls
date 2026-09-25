import { getSessionCookie } from "better-auth/cookies";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Landing } from "@/components/landing/Landing";
import { getAuth } from "@/lib/auth";
import { signOutAction } from "@/lib/sign-out-action";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/design-system";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing");
  return { description: t("metaDescription") };
}

/**
 * Split from `Home` below so `useTranslations` only runs once React
 * actually renders this component — inside whatever provider wraps the
 * page — rather than eagerly inside `Home`'s own (async) function body,
 * before rendering has started.
 */
function HomeContent({ name }: { name: string }) {
  const t = useTranslations("home");

  return (
    <main className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-12 md:px-16 md:py-16">
      <div className="flex items-center justify-between gap-4">
        {/* No logo: the name is set in Fraunces at weight 600 (matches AuthLayout's wordmark). */}
        <h1 className="font-display text-display-l font-semibold">{t("heading", { name })}</h1>
        <ThemeToggle />
      </div>
      <p className="text-body text-ink-muted">{t("body")}</p>
      <form action={signOutAction}>
        <Button type="submit" variant="outline">
          {t("signOutButton")}
        </Button>
      </form>
    </main>
  );
}

/**
 * `/` is the landing page for visitors and the placeholder home (D17) for
 * signed-in users; the real shelf is Phase 1 (`OnboardBag`).
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

  return <HomeContent name={session.user.name} />;
}
