import { useTranslations } from "next-intl";
import { PageShell } from "@/shared/ui/page-shell";

export function QrEntryPage() {
  const t = useTranslations("QrPage");

  return (
    <PageShell
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
    >
      <div className="rounded-3xl border border-primary/20 bg-card/75 p-6 text-sm leading-6 text-muted-foreground shadow-lg shadow-primary/8">
        {t("placeholder")}
      </div>
    </PageShell>
  );
}
