import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { useTranslations } from "next-intl";
import { getAuth } from "@/lib/auth";
import { signOutAction } from "@/lib/sign-out-action";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/design-system";

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
 * Placeholder home (D17): the real shelf is Phase 1 (`OnboardBag`). This is
 * signed-in only — `proxy.ts`'s cookie check is optimistic (Stage D), so
 * this reads the real session server-side and redirects if it's missing or
 * stale.
 */
export default async function Home() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
    return null;
  }

  return <HomeContent name={session.user.name} />;
}
