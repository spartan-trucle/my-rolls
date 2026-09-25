import { useTranslations } from "next-intl";

/** Placeholder (D19): real privacy text is due before the private beta (04.01.2027, content track). */
export default function PrivacyPage() {
  const t = useTranslations("legal.privacy");

  return (
    <main className="mx-auto flex max-w-[720px] flex-col gap-3 px-4 py-16 md:px-0">
      <h1 className="font-display text-display-l font-semibold">{t("heading")}</h1>
      <p className="text-body text-ink-muted">{t("body")}</p>
    </main>
  );
}
