"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/shared/lib/format";
import type { SalesByTimeHeatmap } from "@/shared/types/reports";
import { negativeClass } from "./report-format";

type TimeHeatmapProps = {
  heatmap: SalesByTimeHeatmap;
};

const HOUR_LABEL_STEP = 3;

function cellColor(amount: number, max: number) {
  if (amount > 0 && max > 0) {
    const percent = Math.round(10 + (amount / max) * 80);

    return `color-mix(in oklab, var(--chart-2) ${percent}%, transparent)`;
  }

  if (amount < 0) {
    return "color-mix(in oklab, var(--destructive) 25%, transparent)";
  }

  return undefined;
}

function hourText(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function tooltipPosition(hour: number) {
  if (hour < 4) {
    return "left-0";
  }

  return hour > 19 ? "right-0" : "left-1/2 -translate-x-1/2";
}

export function TimeHeatmap({ heatmap }: TimeHeatmapProps) {
  const t = useTranslations("Reports");
  const amounts = heatmap.amount.map((row) => row.map(Number));
  const max = Math.max(0, ...amounts.flat());
  const days = heatmap.weekdays.map((_, index) => {
    const day = String(index + 1);
    const total = amounts[index].reduce((sum, value) => sum + value, 0);
    const bills = heatmap.bills[index].reduce((sum, value) => sum + value, 0);
    const peak = amounts[index].reduce(
      (best, value, hour) => (value > amounts[index][best] ? hour : best),
      0
    );

    return {
      day,
      name: t(`filters.weekdayLong.${day}`),
      total,
      bills,
      peak: amounts[index][peak] > 0 ? hourText(heatmap.hours[peak]) : null,
    };
  });
  const maxDay = Math.max(0, ...days.map((entry) => entry.total));

  return (
    <section aria-label={t("heatmap.title")} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{t("heatmap.title")}</h3>
        <div
          className="flex items-center gap-2 text-xs text-muted-foreground"
          aria-hidden="true"
        >
          <span>{t("heatmap.less")}</span>
          <span
            className="h-2 w-24 rounded-full"
            style={{
              backgroundImage:
                "linear-gradient(to right, color-mix(in oklab, var(--chart-2) 10%, transparent), var(--chart-2))",
            }}
          />
          <span>{t("heatmap.more")}</span>
        </div>
      </div>

      <div className="hidden rounded-2xl border border-border/70 bg-card p-4 md:block">
        <div className="grid grid-cols-[5.5rem_repeat(24,minmax(0,1fr))] gap-1">
          <span aria-hidden="true" />
          {heatmap.hours.map((hour) => (
            <span
              key={hour}
              aria-hidden="true"
              className="text-center text-[10px] text-muted-foreground tabular-nums"
            >
              {hour % HOUR_LABEL_STEP === 0 ? hour : ""}
            </span>
          ))}
          {days.map((entry, dayIndex) => (
            <div key={entry.day} className="contents">
              <span className="self-center truncate pr-2 text-xs font-medium">
                {entry.name}
              </span>
              {heatmap.hours.map((hour, hourIndex) => {
                const amount = amounts[dayIndex][hourIndex];
                const bills = heatmap.bills[dayIndex][hourIndex];
                const active = bills > 0 || amount !== 0;
                const summary = t("heatmap.cell", {
                  day: entry.name,
                  hour: hourText(hour),
                  amount: formatMoney(amount),
                  bills,
                });

                return (
                  <div
                    key={hour}
                    role="img"
                    aria-label={summary}
                    className={cn(
                      "group relative h-7 rounded-[3px]",
                      !active && "bg-muted/40"
                    )}
                    style={{ backgroundColor: cellColor(amount, max) }}
                  >
                    {active ? (
                      <div
                        className={cn(
                          "pointer-events-none absolute -top-1 z-20 hidden -translate-y-full flex-col gap-0.5 rounded-lg border border-border bg-popover px-2.5 py-1.5 whitespace-nowrap shadow-md group-hover:flex",
                          tooltipPosition(hour)
                        )}
                      >
                        <span className="text-[10px] text-muted-foreground">
                          {entry.name} {hourText(hour)}
                        </span>
                        <span
                          className={cn(
                            "text-xs font-semibold tabular-nums text-popover-foreground",
                            negativeClass(amount)
                          )}
                        >
                          {formatMoney(amount)}
                        </span>
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {t("heatmap.bills", { count: bills })}
                        </span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <ul className="space-y-2 md:hidden">
        {days.map((entry) => (
          <li
            key={entry.day}
            className="rounded-2xl border border-border/70 bg-card p-3"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-medium">{entry.name}</span>
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  negativeClass(entry.total)
                )}
              >
                {formatMoney(entry.total)}
              </span>
            </div>
            <div
              className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted"
              aria-hidden="true"
            >
              <div
                className="h-full rounded-full bg-chart-2"
                style={{
                  width: `${maxDay > 0 ? Math.max(0, (entry.total / maxDay) * 100) : 0}%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground tabular-nums">
              {t("heatmap.bills", { count: entry.bills })}
              {entry.peak ? ` · ${t("heatmap.peak", { hour: entry.peak })}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
