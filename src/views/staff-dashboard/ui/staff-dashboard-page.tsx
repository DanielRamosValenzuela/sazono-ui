import { useTranslations } from "next-intl";
import { FloorConsole } from "@/widgets/floor-console";

export function StaffDashboardPage() {
  const t = useTranslations("StaffPage");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {t("description")}
        </p>
      </header>

      <FloorConsole />
    </div>
  );
}
