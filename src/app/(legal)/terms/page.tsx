import { useTranslations } from "next-intl";

/** Placeholder (D19): real terms are due before the private beta (04.01.2027, content track). */
export default function TermsPage() {
  const t = useTranslations("legal.terms");

  return (
    <main className="mx-auto flex max-w-[720px] flex-col gap-3 px-4 py-16 md:px-0">
      <h1 className="font-display text-display-l font-semibold">{t("heading")}</h1>
      <p className="text-body text-ink-muted">{t("body")}</p>
    </main>
  );
}
