"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/shared/lib/theme";
import { useClientReady } from "@/shared/lib/use-client-ready";

export function ThemeToggle() {
  const t = useTranslations("Shared");
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useClientReady();

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={t("themeDark")}
        className="rounded-full border-border/70 bg-card/80"
      >
        <SunMedium className="size-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      aria-label={isDark ? t("themeLight") : t("themeDark")}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-full border-border/70 bg-card/80 backdrop-blur hover:bg-card"
    >
      {isDark ? <SunMedium className="size-4" /> : <MoonStar className="size-4" />}
    </Button>
  );
}
