import { useTranslations } from "next-intl";
import { AdminConsole } from "@/widgets/admin-console/ui/admin-console";
import { PageShell } from "@/shared/ui/page-shell";

export function AdminWorkspacePage() {
  const t = useTranslations("AdminPage");

  return (
    <PageShell
      eyebrow={t("eyebrow")}
      title={t("title")}
      description={t("description")}
    >
      <AdminConsole />
    </PageShell>
  );
}
