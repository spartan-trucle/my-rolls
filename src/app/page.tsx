import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("common");
  return (
    <main className="mx-auto max-w-[1440px] px-4 py-12 md:px-16 md:py-16">
      {/* No logo: the name is set in Fraunces at weight 600. */}
      <h1 className="font-display text-display-l font-semibold">{t("appName")}</h1>
    </main>
  );
}
