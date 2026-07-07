"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Armchair,
  BookOpenText,
  Receipt,
  UtensilsCrossed,
  Users,
  Wallet,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/shared/api/admin-api";
import { formatMoney } from "@/shared/lib/format";
import { BarChart, BarList } from "@/shared/ui/charts";
import { SelectInput } from "@/shared/ui/form-controls";
import { StatCard } from "@/shared/ui/stat-card";
import { Link } from "@/i18n/navigation";
import { useAdminSession } from "@/features/admin-session/model/use-admin-session";
import { FirstBranchWelcome } from "./branches-panel";

function formatDayLabel(date: string, locale: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(
    new Date(year, month - 1, day)
  );
}

export function RestaurantOverview() {
  const t = useTranslations("RestaurantOverview");
  const tStatus = useTranslations("Shared.orderStatus");
  const locale = useLocale();
  const session = useAdminSession();
  const branches = session.supervisorBranches;
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  const branchId = selectedBranchId ?? branches[0]?.branchId ?? null;

  const analyticsQuery = useQuery({
    queryKey: ["admin", "branch-analytics", session.accessToken, branchId],
    enabled:
      session.isClientReady && Boolean(session.accessToken) && Boolean(branchId),
    queryFn: () => adminApi.getBranchAnalytics(session.accessToken!, branchId!),
  });

  const summary = analyticsQuery.data;

  const quickLinks = useMemo(
    () => [
      {
        href: "/staff",
        icon: <UtensilsCrossed className="size-5" />,
        title: t("linkTablesTitle"),
        description: t("linkTablesDescription"),
      },
      {
        href: "/staff/menu",
        icon: <BookOpenText className="size-5" />,
        title: t("linkMenuTitle"),
        description: t("linkMenuDescription"),
      },
      {
        href: "/admin/team",
        icon: <Users className="size-5" />,
        title: t("linkTeamTitle"),
        description: t("linkTeamDescription"),
      },
    ],
    [t]
  );

  if (session.hasNoBranchRoles) {
    return <FirstBranchWelcome />;
  }

  if (branches.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-border/70 bg-card px-6 py-14 text-center shadow-sm">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <UtensilsCrossed className="size-6" />
        </span>
        <div>
          <h1 className="text-xl font-semibold">{t("operationalTitle")}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {t("operationalDescription")}
          </p>
        </div>
        <Link
          href="/staff"
          className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85"
        >
          <UtensilsCrossed className="size-4" />
          {t("goToTables")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t("description")}
          </p>
        </div>

        {branches.length > 1 ? (
          <div className="w-full sm:w-64">
            <label htmlFor="overview-branch" className="sr-only">
              {t("branchSelector")}
            </label>
            <SelectInput
              id="overview-branch"
              value={branchId ?? ""}
              onChange={(event) => setSelectedBranchId(event.target.value)}
            >
              {branches.map((branch) => (
                <option key={branch.branchId} value={branch.branchId}>
                  {branch.branchName}
                </option>
              ))}
            </SelectInput>
          </div>
        ) : null}
      </header>

      {analyticsQuery.isError ? (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {t("loadError")}
        </div>
      ) : null}

      <section
        aria-label={t("statsAria")}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label={t("occupiedTables")}
          value={
            summary ? `${summary.occupiedTables}/${summary.totalTables}` : "—"
          }
          icon={<Armchair />}
          isLoading={analyticsQuery.isLoading}
        />
        <StatCard
          label={t("openSessions")}
          value={String(summary?.openSessions ?? "—")}
          icon={<Receipt />}
          isLoading={analyticsQuery.isLoading}
        />
        <StatCard
          label={t("todayRevenue")}
          value={summary ? formatMoney(summary.todayRevenue) : "—"}
          hint={
            summary
              ? t("todayPayments", { count: summary.todayPaymentsCount })
              : undefined
          }
          icon={<Wallet />}
          isLoading={analyticsQuery.isLoading}
        />
        <StatCard
          label={t("averageTicket")}
          value={summary ? formatMoney(summary.averageTicket) : "—"}
          icon={<Receipt />}
          isLoading={analyticsQuery.isLoading}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">{t("weekTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("weekDescription")}
          </p>
          <div className="mt-6">
            {analyticsQuery.isLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <BarChart
                data={(summary?.last7Days ?? []).map((point) => ({
                  label: formatDayLabel(point.date, locale),
                  hint: point.date,
                  value: Number(point.amount),
                }))}
                formatValue={(value) =>
                  new Intl.NumberFormat(locale, {
                    notation: "compact",
                    maximumFractionDigits: 1,
                  }).format(value)
                }
                emptyLabel={t("noData")}
              />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">{t("ordersTodayTitle")}</h2>
            {analyticsQuery.isLoading ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <Skeleton className="h-7 w-28 rounded-full" />
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-32 rounded-full" />
              </div>
            ) : (summary?.ordersByStatus.length ?? 0) === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {t("noOrdersToday")}
              </p>
            ) : (
              <ul className="mt-4 flex flex-wrap gap-2">
                {summary!.ordersByStatus.map((entry) => (
                  <li key={entry.status}>
                    <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                      <span className="tabular-nums">{entry.count}</span>
                      {tStatus(entry.status)}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">{t("topItemsTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("topItemsDescription")}
            </p>
            <div className="mt-5">
              {analyticsQuery.isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <BarList
                  data={(summary?.topItems ?? []).map((item) => ({
                    label: item.name,
                    value: Number(item.amount),
                    detail: t("unitsShort", { count: item.quantity }),
                  }))}
                  formatValue={(value) => formatMoney(value)}
                  emptyLabel={t("noData")}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      <section aria-label={t("quickLinksAria")} className="grid gap-4 md:grid-cols-3">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group cursor-pointer rounded-3xl border border-border/70 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              {link.icon}
            </span>
            <h3 className="mt-4 font-semibold">{link.title}</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {link.description}
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}
