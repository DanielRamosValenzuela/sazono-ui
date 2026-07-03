"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function LocaleSwitcher() {
  const t = useTranslations("Shared");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div
      aria-label={t("localeLabel")}
      className="flex items-center gap-1 rounded-full border border-border/70 bg-card/80 p-1 backdrop-blur"
    >
      <div className="flex size-8 items-center justify-center text-muted-foreground">
        <Languages className="size-4" />
      </div>
      {routing.locales.map((nextLocale) => (
        <Link
          key={nextLocale}
          href={pathname}
          locale={nextLocale}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] transition",
            locale === nextLocale
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {t(`locale_${nextLocale}`)}
        </Link>
      ))}
    </div>
  );
}
