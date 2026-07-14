"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, ChefHat, MapPinOff, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authApi } from "@/shared/api/auth-api";
import { FieldGroup, FieldHint, TextInput } from "@/shared/ui/form-controls";
import { LocaleSwitcher } from "@/shared/ui/locale-switcher";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import type { RestaurantSearchResult } from "@/shared/types/auth";
import { Link } from "@/i18n/navigation";

type SearchFormValues = {
  q: string;
};

export function FindRestaurant() {
  const t = useTranslations("FindRestaurantScreen");
  const [hasSearched, setHasSearched] = useState(false);
  const form = useForm<SearchFormValues>({ defaultValues: { q: "" } });

  const searchMutation = useMutation({
    mutationFn: (query: string) => authApi.searchRestaurants(query),
    onSuccess: () => {
      setHasSearched(true);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("searchError"));
    },
  });

  const results: RestaurantSearchResult[] = searchMutation.data ?? [];
  const showEmptyState =
    hasSearched && !searchMutation.isPending && results.length === 0;

  return (
    <main className="flex min-h-screen flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-end gap-2 px-6 pt-6">
        <LocaleSwitcher />
        <ThemeToggle />
      </div>

      <div className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <ChefHat className="size-7" />
            </div>
            <h1 className="mt-5 font-heading text-3xl font-bold tracking-tight">
              {t("title")}
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              {t("description")}
            </p>
          </div>

          <form
            onSubmit={form.handleSubmit((values) => {
              setHasSearched(false);
              searchMutation.mutate(values.q.trim());
            })}
            className="mt-8 space-y-3 rounded-3xl border border-border/70 bg-card p-6 shadow-lg shadow-primary/8 sm:p-8"
          >
            <FieldGroup>
              <div className="flex gap-2">
                <TextInput
                  autoFocus
                  placeholder={t("searchPlaceholder")}
                  {...form.register("q", { minLength: 2 })}
                />
                <Button
                  type="submit"
                  size="icon-lg"
                  className="shrink-0 rounded-xl"
                  disabled={searchMutation.isPending}
                  aria-label={t("searchButton")}
                >
                  {searchMutation.isPending ? (
                    <Spinner />
                  ) : (
                    <Search className="size-4" />
                  )}
                </Button>
              </div>
              <FieldHint>{t("minCharsHint")}</FieldHint>
            </FieldGroup>
          </form>

          {results.length > 0 ? (
            <div className="animate-in fade-in slide-in-from-top-2 mt-5 space-y-2 duration-300">
              <p className="px-1 text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
                {t("resultsTitle")}
              </p>
              {results.map((result) => (
                <Link
                  key={result.slug}
                  href={`/r/${result.slug}/login`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3.5 text-sm font-medium shadow-sm transition-colors hover:bg-muted/60"
                >
                  {result.name}
                  <ArrowRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          ) : null}

          {showEmptyState ? (
            <div className="animate-in fade-in mt-5 flex flex-col items-center rounded-2xl border border-dashed border-border/80 px-6 py-8 text-center duration-300">
              <MapPinOff className="size-6 text-muted-foreground" />
              <p className="mt-3 font-medium">{t("emptyTitle")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("emptyDescription")}
              </p>
              <Link
                href="/#contacto"
                className="mt-4 text-sm font-medium text-primary hover:underline"
              >
                {t("emptyContactCta")}
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
