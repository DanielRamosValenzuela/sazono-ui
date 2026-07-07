"use client";

import { cn } from "@/lib/utils";

export type BarChartDatum = {
  label: string;
  value: number;
  /** Texto completo para el tooltip (si el label visible está abreviado). */
  hint?: string;
};

type BarChartProps = {
  data: BarChartDatum[];
  formatValue: (value: number) => string;
  className?: string;
  /** Alto del área de barras en px. */
  height?: number;
  emptyLabel: string;
};

function buildTicks(maxValue: number) {
  if (maxValue <= 0) {
    return [0];
  }

  const magnitude = 10 ** Math.floor(Math.log10(maxValue));
  const step = Math.ceil(maxValue / magnitude / 2) * (magnitude / 2);
  const top = Math.max(step * 2, step);
  return [top, top / 2, 0];
}

export function BarChart({
  data,
  formatValue,
  className,
  height = 190,
  emptyLabel,
}: BarChartProps) {
  const maxValue = Math.max(...data.map((datum) => datum.value), 0);
  const hasData = data.some((datum) => datum.value > 0);
  const ticks = buildTicks(maxValue);
  const scaleTop = ticks[0] || 1;

  if (data.length === 0 || !hasData) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl border border-dashed border-border/80 text-sm text-muted-foreground",
          className
        )}
        style={{ height: height + 44 }}
      >
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="relative" style={{ height }}>
        {/* Rejilla horizontal recesiva con etiquetas de eje */}
        {ticks.map((tick) => (
          <div
            key={tick}
            className="absolute inset-x-0 flex items-center gap-2"
            style={{ bottom: `${(tick / scaleTop) * 100}%` }}
          >
            <span className="w-12 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground/80">
              {formatValue(tick)}
            </span>
            <div
              className={cn(
                "h-px flex-1",
                tick === 0 ? "bg-border" : "bg-border/50"
              )}
            />
          </div>
        ))}

        <div className="absolute inset-y-0 right-0 left-14 flex items-end gap-1">
          {data.map((datum) => {
            const ratio = datum.value / scaleTop;
            return (
              <div
                key={datum.label}
                className="group relative flex h-full flex-1 items-end"
              >
                <div
                  role="img"
                  aria-label={`${datum.hint ?? datum.label}: ${formatValue(datum.value)}`}
                  className="w-full rounded-t-[4px] bg-chart-2 transition-colors group-hover:bg-chart-1"
                  style={{
                    height: `${Math.max(ratio * 100, datum.value > 0 ? 1.5 : 0)}%`,
                  }}
                />
                <div
                  className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full flex-col items-center gap-0.5 rounded-lg border border-border bg-popover px-2.5 py-1.5 whitespace-nowrap shadow-md group-hover:flex"
                >
                  <span className="text-[10px] text-muted-foreground">
                    {datum.hint ?? datum.label}
                  </span>
                  <span className="text-xs font-semibold tabular-nums text-popover-foreground">
                    {formatValue(datum.value)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex gap-1 pl-14">
        {data.map((datum) => (
          <span
            key={datum.label}
            className="flex-1 truncate text-center text-[10px] text-muted-foreground"
          >
            {datum.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export type BarListDatum = {
  label: string;
  value: number;
  detail?: string;
};

type BarListProps = {
  data: BarListDatum[];
  formatValue: (value: number) => string;
  className?: string;
  emptyLabel: string;
};

export function BarList({
  data,
  formatValue,
  className,
  emptyLabel,
}: BarListProps) {
  const maxValue = Math.max(...data.map((datum) => datum.value), 0);

  if (data.length === 0 || maxValue <= 0) {
    return (
      <div
        className={cn(
          "flex h-28 items-center justify-center rounded-2xl border border-dashed border-border/80 text-sm text-muted-foreground",
          className
        )}
      >
        {emptyLabel}
      </div>
    );
  }

  return (
    <ul className={cn("space-y-3", className)}>
      {data.map((datum) => (
        <li key={datum.label} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium text-foreground">
              {datum.label}
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {formatValue(datum.value)}
              {datum.detail ? (
                <span className="ml-1.5 text-xs text-muted-foreground/70">
                  {datum.detail}
                </span>
              ) : null}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-chart-2"
              style={{ width: `${(datum.value / maxValue) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
