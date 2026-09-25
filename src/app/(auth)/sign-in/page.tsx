import Link from "next/link";
import { useTranslations } from "next-intl";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { FilmStrip, Scribble } from "@/design-system";
import { SAMPLE_PHOTOS } from "@/lib/samples";
import authText from "@/components/auth/authText.module.css";

/** Login board (D7): returning users. Same Google call as `/sign-up` (D16). */
export default function SignInPage() {
  const t = useTranslations("auth.signIn");
  const tSamples = useTranslations("samples");

  const frames = SAMPLE_PHOTOS.map((photo, index) => ({
    src: photo.src,
    alt: tSamples(photo.id),
    number: index + 1,
    flag: photo.flag,
  }));

  return (
    <AuthLayout
      phoneStrip={
        <>
          <FilmStrip
            labels={{ strip: t("filmStripLabel"), keeper: t("keeperLabel"), oops: t("oopsLabel") }}
            edgeText={t("filmStripEdgeText")}
            frameWidth={150}
            frames={frames}
          />
          <Scribble arrow="left" size="sm" className="self-end pr-4">
            {t("filmStripScribble")}
          </Scribble>
        </>
      }
      actions={
        <>
          <GoogleButton label={t("googleButton")} />
          <p className={authText.note}>{t("privacyNote")}</p>
          <p className={authText.crossLink}>
            {t.rich("crossLink", { link: (chunks) => <Link href="/sign-up">{chunks}</Link> })}
          </p>
        </>
      }
    >
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-display-l font-semibold tracking-[-0.015em] lg:text-display-xl lg:tracking-[-0.02em]">
          {t("title")}
        </h1>
        <p className="text-body-sm text-ink-muted lg:text-body">{t("subtitle")}</p>
      </div>
    </AuthLayout>
  );
}
