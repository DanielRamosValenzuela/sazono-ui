"use client";

import { ChefHat } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { LocaleSwitcher } from "@/shared/ui/locale-switcher";
import { ThemeToggle } from "@/shared/ui/theme-toggle";

export function SiteHeader() {
  const t = useTranslations("HomePage");

  return (
    <header className="relative z-10 mx-auto w-full max-w-7xl px-6 pt-6 sm:px-10 lg:px-12">
      <nav className="flex items-center justify-between rounded-full border border-border/70 bg-card/78 px-4 py-3 shadow-lg shadow-primary/8 backdrop-blur">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full border border-primary/15 bg-primary text-primary-foreground shadow-md shadow-primary/15">
            <ChefHat className="size-4" />
          </div>
          <div>
            <p className="font-heading text-2xl leading-none">Sazono</p>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              {t("navTagline")}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/#producto"
            className={cn(
              buttonVariants({ variant: "ghost", size: "lg" }),
              "hidden md:inline-flex"
            )}
          >
            {t("navProduct")}
          </Link>
          <Link
            href="/ingresar"
            className={cn(
              buttonVariants({ variant: "ghost", size: "lg" }),
              "hidden md:inline-flex"
            )}
          >
            {t("navClient")}
          </Link>
          <LocaleSwitcher />
          <ThemeToggle />
          <Link
            href="/#contacto"
            className={cn(buttonVariants({ size: "lg" }), "rounded-full px-4")}
          >
            {t("navCta")}
          </Link>
        </div>
      </nav>
    </header>
  );
}
