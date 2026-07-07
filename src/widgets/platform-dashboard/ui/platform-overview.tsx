"use client";

import { useQuery } from "@tanstack/react-query";
import { Banknote, MapPin, Store, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/shared/api/admin-api";
import { formatMoney } from "@/shared/lib/format";
import { BarChart, BarList } from "@/shared/ui/charts";
import { StatCard } from "@/shared/ui/stat-card";
import { useAdminSession } from "@/features/admin-session/model/use-admin-session";

function formatMonthLabel(month: string, locale: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, { month: "short" }).format(
    new Date(year, monthNumber - 1, 1)
  );
}

export function PlatformOverview() {
  const t = useTranslations("PlatformOverview");
  const locale = useLocale();
  const { accessToken, isClientReady } = useAdminSession();

  const metricsQuery = useQuery({
    queryKey: ["admin", "platform-metrics", accessToken],
    enabled: isClientReady && Boolean(accessToken),
    queryFn: () => adminApi.getPlatformMetrics(accessToken!),
  });

  const metrics = metricsQuery.data;
  const compact = new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  });

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

      {metricsQuery.isError ? (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {t("loadError")}
        </div>
      ) : null}

      <section
        aria-label={t("statsAria")}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label={t("restaurants")}
          value={String(metrics?.totals.restaurants ?? "—")}
          hint={
            metrics
              ? t("activeRestaurants", {
                  count: metrics.totals.activeRestaurants,
                })
              : undefined
          }
          icon={<Store />}
          isLoading={metricsQuery.isLoading}
        />
        <StatCard
          label={t("branches")}
          value={String(metrics?.totals.branches ?? "—")}
          icon={<MapPin />}
          isLoading={metricsQuery.isLoading}
        />
        <StatCard
          label={t("staff")}
          value={String(metrics?.totals.staffUsers ?? "—")}
          icon={<Users />}
          isLoading={metricsQuery.isLoading}
        />
        <StatCard
          label={t("processedTotal")}
          value={
            metrics ? formatMoney(metrics.totals.paymentsAmount) : "—"
          }
          hint={
            metrics
              ? t("paymentsCount", { count: metrics.totals.paymentsCount })
              : undefined
          }
          icon={<Banknote />}
          isLoading={metricsQuery.isLoading}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">{t("monthlyTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("monthlyDescription")}
          </p>
          <div className="mt-6">
            {metricsQuery.isLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <BarChart
                data={(metrics?.monthlyPayments ?? []).map((point) => ({
                  label: formatMonthLabel(point.month, locale),
                  hint: point.month,
                  value: Number(point.amount),
                }))}
                formatValue={(value) => compact.format(value)}
                emptyLabel={t("noData")}
              />
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">{t("topTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("topDescription")}
          </p>
          <div className="mt-6">
            {metricsQuery.isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <BarList
                data={(metrics?.topRestaurants ?? []).map((entry) => ({
                  label: entry.name,
                  value: Number(entry.amount),
                  detail: t("paymentsShort", { count: entry.count }),
                }))}
                formatValue={(value) => formatMoney(value)}
                emptyLabel={t("noData")}
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
