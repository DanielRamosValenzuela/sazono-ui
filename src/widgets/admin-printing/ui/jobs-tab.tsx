"use client";

import { useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Eye, RotateCw, Printer as PrinterIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { printingApi } from "@/shared/api/printing-api";
import type { PrintJob, PrintJobStatus } from "@/shared/types/printing";
import { usePrintErrorText } from "@/shared/lib/print-error";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { SelectInput } from "@/shared/ui/form-controls";
import { formatReportDateTime } from "@/widgets/reports/ui/report-range";
import {
  JobStatusBadge,
  SectionCard,
  usePrintingErrorMessage,
} from "./printing-shared";
import {
  ReceiptPreviewDialog,
  type PreviewSource,
} from "./receipt-preview-dialog";

const PAGE_SIZE = 30;
const STATUSES: PrintJobStatus[] = [
  "PENDING",
  "CLAIMED",
  "PRINTED",
  "FAILED",
  "CANCELLED",
];

type JobsTabProps = {
  token: string | null;
  branchId: string;
};

export function JobsTab({ token, branchId }: JobsTabProps) {
  const t = useTranslations("AdminPrinting");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const describeError = usePrintingErrorMessage();
  const describePrintError = usePrintErrorText();
  const [status, setStatus] = useState<PrintJobStatus | "">("");
  const [printerId, setPrinterId] = useState("");
  const [preview, setPreview] = useState<PreviewSource | null>(null);
  const [reprinting, setReprinting] = useState<PrintJob | null>(null);

  const printersQuery = useQuery({
    queryKey: ["printing", "printers", branchId],
    enabled: Boolean(token),
    queryFn: () => printingApi.listPrinters(token!, branchId),
  });

  const jobsQuery = useInfiniteQuery({
    queryKey: ["printing", "jobs", branchId, status, printerId],
    enabled: Boolean(token),
    refetchInterval: 15_000,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      printingApi.listJobs(token!, branchId, {
        status: status || undefined,
        printerId: printerId || undefined,
        before: pageParam,
        limit: PAGE_SIZE,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.length === PAGE_SIZE
        ? lastPage[lastPage.length - 1].createdAt
        : undefined,
  });

  const jobs = jobsQuery.data?.pages.flat() ?? [];

  const reprintMutation = useMutation({
    mutationFn: (jobId: string) =>
      printingApi.reprintJob(token!, branchId, jobId),
    onSuccess: () => {
      toast.success(t("reprintQueued"));
      setReprinting(null);
      void queryClient.invalidateQueries({ queryKey: ["printing", "jobs"] });
    },
    onError: (error) => {
      setReprinting(null);
      toast.error(describeError(error, t("reprintError")));
    },
  });

  const retryMutation = useMutation({
    mutationFn: (jobId: string) => printingApi.retryJob(token!, branchId, jobId),
    onSuccess: () => {
      toast.success(t("retryQueued"));
      void queryClient.invalidateQueries({ queryKey: ["printing", "jobs"] });
    },
    onError: (error) => {
      toast.error(describeError(error, t("retryError")));
    },
  });

  return (
    <SectionCard title={t("jobsTitle")} description={t("jobsDescription")}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="jobs-status" className="sr-only">
            {t("filterStatus")}
          </label>
          <SelectInput
            id="jobs-status"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as PrintJobStatus | "")
            }
          >
            <option value="">{t("allStatuses")}</option>
            {STATUSES.map((entry) => (
              <option key={entry} value={entry}>
                {t(`jobStatus.${entry}`)}
              </option>
            ))}
          </SelectInput>
        </div>
        <div>
          <label htmlFor="jobs-printer" className="sr-only">
            {t("filterPrinter")}
          </label>
          <SelectInput
            id="jobs-printer"
            value={printerId}
            onChange={(event) => setPrinterId(event.target.value)}
          >
            <option value="">{t("allPrinters")}</option>
            {(printersQuery.data ?? []).map((printer) => (
              <option key={printer.id} value={printer.id}>
                {printer.name}
              </option>
            ))}
          </SelectInput>
        </div>
      </div>

      {jobsQuery.isLoading ? (
        <Skeleton className="h-32 w-full rounded-2xl" />
      ) : jobsQuery.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {t("jobsError")}
        </p>
      ) : jobs.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {t("jobsEmpty")}
        </p>
      ) : (
        <ul className="divide-y divide-border/60 rounded-2xl border border-border/70">
          {jobs.map((job) => (
            <li key={job.id} className="space-y-2 px-4 py-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-base font-bold">
                      {job.displayNumber ?? t("noNumber")}
                    </p>
                    <JobStatusBadge status={job.status} />
                    {job.kind !== "COMANDA" ? (
                      <Badge variant="outline">{t(`jobKind.${job.kind}`)}</Badge>
                    ) : null}
                    {job.reprintOfId || job.reprintNumber ? (
                      <Badge variant="outline">
                        {job.reprintNumber
                          ? t("reprintNumberBadge", { number: job.reprintNumber })
                          : t("reprintBadge")}
                      </Badge>
                    ) : null}
                    {job.lastError?.startsWith("MANUAL_RETRY") ? (
                      <Badge variant="outline">{t("manualRetryBadge")}</Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {[job.stationName, job.printerName]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatReportDateTime(job.createdAt, locale)}
                    {" · "}
                    {t("attempts", { count: job.attempts })}
                    {job.duplicateAcks > 0
                      ? ` · ${t("duplicates", { count: job.duplicateAcks })}`
                      : ""}
                  </p>
                </div>
              </div>

              {job.lastError ? (
                <p
                  role="alert"
                  className="rounded-xl border border-destructive/25 bg-destructive/8 px-3 py-2 text-xs break-words text-destructive"
                >
                  {describePrintError(job.lastError)}
                </p>
              ) : null}

              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-full sm:h-10"
                  onClick={() => setPreview({ type: "job", jobId: job.id })}
                >
                  <Eye />
                  {t("viewTicket")}
                </Button>
                {job.kind === "COMANDA" ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-full sm:h-10"
                    onClick={() => setReprinting(job)}
                  >
                    <PrinterIcon />
                    {t("reprint")}
                  </Button>
                ) : null}
                {job.status === "FAILED" ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-full sm:h-10"
                    disabled={retryMutation.isPending}
                    onClick={() => retryMutation.mutate(job.id)}
                  >
                    {retryMutation.isPending &&
                    retryMutation.variables === job.id ? (
                      <Spinner />
                    ) : (
                      <RotateCw />
                    )}
                    {t("retry")}
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {jobsQuery.hasNextPage ? (
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-full"
          disabled={jobsQuery.isFetchingNextPage}
          onClick={() => void jobsQuery.fetchNextPage()}
        >
          {jobsQuery.isFetchingNextPage ? <Spinner /> : null}
          {t("loadMore")}
        </Button>
      ) : null}

      <ReceiptPreviewDialog
        token={token}
        branchId={branchId}
        source={preview}
        onClose={() => setPreview(null)}
      />

      <ConfirmDialog
        open={reprinting !== null}
        onOpenChange={(open) => {
          if (!open) {
            setReprinting(null);
          }
        }}
        title={t("reprintConfirm.title", {
          number: reprinting?.displayNumber ?? t("noNumber"),
        })}
        description={t("reprintConfirm.description", {
          printer: reprinting?.printerName ?? "",
        })}
        impact={t("reprintConfirm.impact")}
        confirmLabel={t("reprintConfirm.confirm")}
        tone="warning"
        isPending={reprintMutation.isPending}
        onConfirm={() => {
          if (reprinting) {
            reprintMutation.mutate(reprinting.id);
          }
        }}
      />
    </SectionCard>
  );
}
