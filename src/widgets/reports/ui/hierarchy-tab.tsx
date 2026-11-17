"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronRight, Download } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { reportsApi } from "@/shared/api/reports-api";
import { formatMoney } from "@/shared/lib/format";
import {
  HIERARCHY_GROUP_BYS,
  type HierarchyGroupBy,
  type HierarchyNode,
} from "@/shared/types/reports";
import { downloadBlob } from "./download-blob";
import { ReportQueryState } from "./report-parts";
import type { DateRange } from "./report-range";
import { BodyCell, FootCell, HeadCell } from "./report-table";

type SortKey = "amount" | "quantity";

type HierarchyScope = {
  token: string;
  branchId: string;
  range: DateRange;
  groupBy: HierarchyGroupBy;
  includeModifiers: boolean;
  sortBy: SortKey;
};

type HierarchyTabProps = {
  accessToken: string | null;
  branchId: string;
  range: DateRange;
  enabled: boolean;
};

const INDENT_PX = 16;

function useHierarchy(
  scope: HierarchyScope,
  parentId: string | null,
  enabled: boolean
) {
  return useQuery({
    queryKey: [
      "reports",
      "hierarchy",
      scope.branchId,
      scope.range.from,
      scope.range.to,
      scope.groupBy,
      scope.includeModifiers,
      parentId ?? "root",
    ],
    enabled,
    queryFn: () =>
      reportsApi.getSalesByHierarchy(scope.token, scope.branchId, {
        ...scope.range,
        groupBy: scope.groupBy,
        includeModifiers: scope.includeModifiers,
        parentId: parentId ?? undefined,
      }),
  });
}

function sortNodes(nodes: HierarchyNode[], sortBy: SortKey) {
  return [...nodes].sort(
    (a, b) =>
      Number(b[sortBy]) - Number(a[sortBy]) || a.name.localeCompare(b.name)
  );
}

function ShareCell({ share }: { share: number }) {
  const locale = useLocale();
  const label = new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(share / 100);

  return (
    <div className="flex items-center justify-end gap-2">
      <div
        className="h-1.5 w-20 overflow-hidden rounded-full bg-muted"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.min(100, Math.max(0, share))}%` }}
        />
      </div>
      <span className="w-14 text-right">{label}</span>
    </div>
  );
}

type RowsProps = {
  scope: HierarchyScope;
  depth: number;
  onDrill: (node: HierarchyNode) => void;
};

function NodeRows({ node, scope, depth, onDrill }: RowsProps & { node: HierarchyNode }) {
  const t = useTranslations("Reports");
  const [open, setOpen] = useState(false);
  const expandable = node.hasChildren;

  return (
    <>
      <tr className="hover:bg-muted/40">
        <BodyCell className="whitespace-normal break-words">
          <div
            className="flex items-center gap-1"
            style={{ paddingLeft: depth * INDENT_PX }}
          >
            {expandable ? (
              <button
                type="button"
                aria-expanded={open}
                aria-label={t(open ? "hierarchyCollapse" : "hierarchyExpand", {
                  name: node.name,
                })}
                className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setOpen((current) => !current)}
              >
                <ChevronRight
                  className={cn("size-4 transition-transform", open && "rotate-90")}
                />
              </button>
            ) : (
              <span className="size-7 shrink-0" aria-hidden="true" />
            )}
            {expandable ? (
              <button
                type="button"
                title={t("hierarchyOpen", { name: node.name })}
                className="cursor-pointer text-left font-medium hover:underline"
                onClick={() => onDrill(node)}
              >
                {node.name}
              </button>
            ) : (
              <span>{node.name}</span>
            )}
          </div>
        </BodyCell>
        <BodyCell align="right" className="font-medium">
          {formatMoney(node.amount)}
        </BodyCell>
        <BodyCell align="right">{node.quantity}</BodyCell>
        <BodyCell className="hidden md:table-cell">
          <ShareCell share={node.share} />
        </BodyCell>
      </tr>
      {open && expandable ? (
        <ChildRows
          parentId={node.id}
          scope={scope}
          depth={depth + 1}
          onDrill={onDrill}
        />
      ) : null}
    </>
  );
}

function ChildRows({
  parentId,
  scope,
  depth,
  onDrill,
}: RowsProps & { parentId: string }) {
  const t = useTranslations("Reports");
  const query = useHierarchy(scope, parentId, true);

  if (query.isLoading) {
    return (
      <tr aria-busy="true">
        <td
          colSpan={4}
          className="px-3 py-2"
          style={{ paddingLeft: depth * INDENT_PX + 40 }}
        >
          <Skeleton className="h-6 w-full max-w-xs" />
        </td>
      </tr>
    );
  }

  if (query.isError) {
    return (
      <tr>
        <td
          colSpan={4}
          className="px-3 py-2"
          style={{ paddingLeft: depth * INDENT_PX + 40 }}
        >
          <div role="alert" className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-destructive">{t("errorTitle")}</span>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => void query.refetch()}
            >
              {t("retry")}
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <>
      {sortNodes(query.data?.nodes ?? [], scope.sortBy).map((node) => (
        <NodeRows
          key={node.id}
          node={node}
          scope={scope}
          depth={depth}
          onDrill={onDrill}
        />
      ))}
    </>
  );
}

export function HierarchyTab({
  accessToken,
  branchId,
  range,
  enabled,
}: HierarchyTabProps) {
  const t = useTranslations("Reports");
  const [groupBy, setGroupBy] = useState<HierarchyGroupBy>("category");
  const [includeModifiers, setIncludeModifiers] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>("amount");
  const [focusId, setFocusId] = useState<string | null>(null);

  const scope: HierarchyScope = {
    token: accessToken ?? "",
    branchId,
    range,
    groupBy,
    includeModifiers,
    sortBy,
  };
  const ready = enabled && Boolean(accessToken);
  const parentId = groupBy === "category" ? focusId : null;
  const query = useHierarchy(scope, parentId, ready);
  const data = query.data;
  const nodes = sortNodes(data?.nodes ?? [], sortBy);
  const breadcrumb = data?.breadcrumb ?? [];

  const exportMutation = useMutation({
    mutationFn: async () => {
      const blob = await reportsApi.downloadCsv(
        accessToken!,
        branchId,
        "sales-by-hierarchy",
        range,
        { groupBy, includeModifiers, parentId: parentId ?? undefined }
      );
      downloadBlob(
        blob,
        `jerarquia-ventas_${branchId}_${range.from}_${range.to}.csv`
      );
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("exportError"));
    },
  });

  const selectGroupBy = (next: HierarchyGroupBy) => {
    setGroupBy(next);
    setFocusId(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label={t("hierarchyGroupByLabel")}
        >
          {HIERARCHY_GROUP_BYS.map((entry) => (
            <Button
              key={entry}
              size="sm"
              variant={groupBy === entry ? "default" : "outline"}
              className="rounded-full"
              aria-pressed={groupBy === entry}
              onClick={() => selectGroupBy(entry)}
            >
              {t(`hierarchyGroupBy.${entry}`)}
            </Button>
          ))}
        </div>

        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label={t("hierarchySortLabel")}
        >
          <span className="text-xs font-medium text-muted-foreground">
            {t("hierarchySortLabel")}
          </span>
          {(["amount", "quantity"] as const).map((entry) => (
            <Button
              key={entry}
              size="sm"
              variant={sortBy === entry ? "secondary" : "outline"}
              className="rounded-full"
              aria-pressed={sortBy === entry}
              onClick={() => setSortBy(entry)}
            >
              {entry === "amount" ? t("colAmount") : t("colQuantity")}
            </Button>
          ))}
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            role="switch"
            checked={includeModifiers}
            onChange={(event) => setIncludeModifiers(event.target.checked)}
          />
          {t("hierarchyIncludeModifiers")}
        </label>

        <Button
          variant="outline"
          className="ml-auto rounded-full"
          disabled={!ready || exportMutation.isPending}
          onClick={() => exportMutation.mutate()}
        >
          {exportMutation.isPending ? <Spinner /> : <Download />}
          {t("exportCsv")}
        </Button>
      </div>

      {groupBy === "category" && focusId ? (
        <nav aria-label={t("hierarchyBreadcrumbLabel")}>
          <ol className="flex flex-wrap items-center gap-1 text-sm">
            <li>
              <button
                type="button"
                className="cursor-pointer rounded-md px-1.5 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setFocusId(null)}
              >
                {t("hierarchyRoot")}
              </button>
            </li>
            {breadcrumb.map((entry, index) => {
              const isLast = index === breadcrumb.length - 1;

              return (
                <li key={entry.id} className="flex items-center gap-1">
                  <ChevronRight
                    className="size-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                  {isLast ? (
                    <span aria-current="page" className="px-1.5 py-1 font-semibold">
                      {entry.name}
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="cursor-pointer rounded-md px-1.5 py-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={() => setFocusId(entry.id)}
                    >
                      {entry.name}
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}

      <ReportQueryState
        isLoading={query.isLoading}
        isError={query.isError}
        isEmpty={nodes.length === 0}
        onRetry={() => void query.refetch()}
      >
        <div className="max-h-[65vh] overflow-auto rounded-2xl border border-border/70 bg-card">
          <table
            aria-label={t("hierarchyTableLabel")}
            className="w-full border-separate border-spacing-0 text-sm tabular-nums"
          >
            <thead>
              <tr>
                <HeadCell>{t("colHierarchy")}</HeadCell>
                <HeadCell align="right">{t("colAmount")}</HeadCell>
                <HeadCell align="right">{t("colQuantity")}</HeadCell>
                <HeadCell align="right" className="hidden md:table-cell">
                  {t("colShare")}
                </HeadCell>
              </tr>
            </thead>
            <tbody>
              {nodes.map((node) => (
                <NodeRows
                  key={node.id}
                  node={node}
                  scope={scope}
                  depth={0}
                  onDrill={(entry) => setFocusId(entry.id)}
                />
              ))}
            </tbody>
            {data ? (
              <tfoot>
                <tr>
                  <FootCell>{t("hierarchyTotal")}</FootCell>
                  <FootCell align="right">
                    {formatMoney(data.totals.amount)}
                  </FootCell>
                  <FootCell align="right">{data.totals.quantity}</FootCell>
                  <FootCell className="hidden md:table-cell">{null}</FootCell>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </ReportQueryState>
    </div>
  );
}
