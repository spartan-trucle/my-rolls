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
            {t.rich("crossLink", {
              link: (chunks) => (
                <Link href="/sign-up" className={authText.link}>
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </>
      }
    >
      {/* gap-4 (space-4, 16px): owner ask, heading to subtitle, both layouts. */}
      <div className="flex flex-col gap-4">
        {/*
          display-l (40/44, Fraunces 500, -0.015em — all from the token, no
          extra font-weight/tracking utility needed) at every width: display-xl
          on desktop wrapped "Chào mừng trở lại" down to a lone "lại" on its
          own line. `text-balance` only ever kicks in if a very narrow phone
          forces a wrap — never `white-space: nowrap`, which would overflow
          instead. `auth.signIn.title` itself pins the one allowed break
          point with NBSPs (see messages/vi.json), so a forced wrap can only
          ever land as "Chào mừng" / "trở lại", never mid-pair.
        */}
        <h1 className="font-display text-display-l text-balance">{t("title")}</h1>
        <p className="text-body-sm text-ink-muted lg:text-body">{t("subtitle")}</p>
      </div>
    </AuthLayout>
  );
}
