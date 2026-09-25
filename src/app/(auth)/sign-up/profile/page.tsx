import Image from "next/image";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { useTranslations } from "next-intl";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { getAuth } from "@/lib/auth";
import { ProfileForm } from "./ProfileForm";
import styles from "./page.module.css";

interface IProfileContentProps {
  name: string;
  email: string;
  image: string | null | undefined;
}

/**
 * Split from the async `SignUpProfilePage` below so `useTranslations` only
 * runs once React actually renders it (see `src/app/page.tsx`'s `HomeContent`
 * for the same split, and why).
 */
function ProfileContent({ name, email, image }: IProfileContentProps) {
  const t = useTranslations("auth.profile");
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <AuthLayout actions={null}>
      <div className="flex flex-col gap-4">
        {image ? (
          <Image src={image} alt={t("avatarAlt")} width={72} height={72} className={styles.avatarImage} />
        ) : (
          <span className={styles.avatarFallback} role="img" aria-label={t("avatarAlt")}>
            {initial}
          </span>
        )}
        <div className="flex flex-col gap-1">
          <span className="text-label uppercase text-ink-muted">{t("stepLabel")}</span>
          <h1 className="font-display text-display-l font-semibold tracking-[-0.015em] lg:text-display-xl lg:tracking-[-0.02em]">
            {t("title")}
          </h1>
          <p className="text-body-sm text-ink-muted lg:text-body">{t("subtitle")}</p>
        </div>
      </div>
      <ProfileForm name={name} email={email} />
    </AuthLayout>
  );
}

/**
 * Signup step 2 (D18): reads the real session server-side (the proxy's
 * cookie check is only optimistic) — no session, no page. `newUserCallbackURL`
 * (Stage D's `getAuth()`) sends first-time Google sign-ins here directly.
 */
export default async function SignUpProfilePage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
    return null;
  }

  return <ProfileContent name={session.user.name} email={session.user.email} image={session.user.image} />;
}
