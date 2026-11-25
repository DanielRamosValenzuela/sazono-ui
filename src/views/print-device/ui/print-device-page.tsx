import { useTranslations } from "next-intl";
import { PrintDevicePanel } from "@/features/print-client/ui/print-device-panel";

export function PrintDevicePage() {
  const t = useTranslations("PrintClient");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          {t("pageTitle")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {t("pageDescription")}
        </p>
      </header>

      <PrintDevicePanel />
    </div>
  );
}
