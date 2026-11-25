"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Plus, Printer as PrinterIcon, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { usePrintErrorText } from "@/shared/lib/print-error";
import { printingApi } from "@/shared/api/printing-api";
import type { Printer } from "@/shared/types/printing";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { formatReportDateTime } from "@/widgets/reports/ui/report-range";
import { PrinterFormDialog } from "./printer-form-dialog";
import {
  PrinterStatusLabel,
  SectionCard,
  usePrintingErrorMessage,
} from "./printing-shared";
import {
  ReceiptPreviewDialog,
  type PreviewSource,
} from "./receipt-preview-dialog";

type PrintersTabProps = {
  token: string | null;
  branchId: string;
};

export function PrintersTab({ token, branchId }: PrintersTabProps) {
  const t = useTranslations("AdminPrinting");
  const locale = useLocale();
  const queryClient = useQueryClient();
  const describeError = usePrintingErrorMessage();
  const describePrintError = usePrintErrorText();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Printer | null>(null);
  const [deleting, setDeleting] = useState<Printer | null>(null);
  const [preview, setPreview] = useState<PreviewSource | null>(null);

  const printersQuery = useQuery({
    queryKey: ["printing", "printers", branchId],
    enabled: Boolean(token),
    refetchInterval: 15_000,
    queryFn: () => printingApi.listPrinters(token!, branchId),
  });
  const stationsQuery = useQuery({
    queryKey: ["printing", "stations", branchId],
    enabled: Boolean(token),
    queryFn: () => printingApi.listStations(token!, branchId),
  });

  const stations = stationsQuery.data ?? [];
  const printers = printersQuery.data ?? [];

  const testMutation = useMutation({
    mutationFn: (printerId: string) =>
      printingApi.testPrinter(token!, branchId, printerId),
    onSuccess: () => {
      toast.success(t("testQueued"));
      void queryClient.invalidateQueries({ queryKey: ["printing", "jobs"] });
    },
    onError: (error) => {
      toast.error(describeError(error, t("testError")));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (printerId: string) =>
      printingApi.deletePrinter(token!, branchId, printerId),
    onSuccess: () => {
      toast.success(t("printerDeleted"));
      setDeleting(null);
      void queryClient.invalidateQueries({ queryKey: ["printing"] });
    },
    onError: (error) => {
      setDeleting(null);
      toast.error(describeError(error, t("printerDeleteError")));
    },
  });

  const openForm = (printer: Printer | null) => {
    setEditing(printer);
    setFormOpen(true);
  };

  const stationNames = (printer: Printer) =>
    printer.stationIds
      .map((id) => stations.find((entry) => entry.stationId === id)?.name)
      .filter(Boolean)
      .join(", ");

  return (
    <SectionCard
      title={t("printersTitle")}
      description={t("printersDescription")}
      actions={
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-full"
            onClick={() => setPreview({ type: "sample" })}
          >
            <Eye />
            {t("viewSample")}
          </Button>
          <Button
            type="button"
            className="h-11 rounded-full"
            onClick={() => openForm(null)}
          >
            <Plus />
            {t("addPrinter")}
          </Button>
        </div>
      }
    >
      {printersQuery.isLoading ? (
        <Skeleton className="h-32 w-full rounded-2xl" />
      ) : printersQuery.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {t("printersError")}
        </p>
      ) : printers.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border/70 p-6 text-center">
          <PrinterIcon className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("printersEmpty")}</p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {printers.map((printer) => (
            <li
              key={printer.id}
              className="space-y-3 rounded-2xl border border-border/70 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold">
                    {printer.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t(`transport.${printer.transport}`)} ·{" "}
                    {printer.paperWidthMm} mm · {printer.columns}{" "}
                    {t("columnsShort")}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <PrinterStatusLabel status={printer.status} />
                  {!printer.active ? (
                    <Badge variant="outline">{t("inactive")}</Badge>
                  ) : null}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                {printer.lastSeenAt
                  ? t("lastSeen", {
                      date: formatReportDateTime(printer.lastSeenAt, locale),
                    })
                  : t("neverSeen")}
                {" · "}
                {stationNames(printer) || t("noStationsAssigned")}
              </p>

              {printer.lastError ? (
                <p
                  role="alert"
                  className="rounded-xl border border-destructive/25 bg-destructive/8 px-3 py-2 text-xs break-words text-destructive"
                >
                  {describePrintError(printer.lastError)}
                </p>
              ) : null}

              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-full sm:h-10"
                  disabled={testMutation.isPending || !printer.active}
                  onClick={() => testMutation.mutate(printer.id)}
                >
                  {testMutation.isPending &&
                  testMutation.variables === printer.id ? (
                    <Spinner />
                  ) : (
                    <PrinterIcon />
                  )}
                  {t("printTest")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-full sm:h-10"
                  onClick={() =>
                    setPreview({ type: "sample", printerId: printer.id })
                  }
                >
                  <Eye />
                  {t("viewTicket")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-full sm:h-10"
                  onClick={() => openForm(printer)}
                >
                  <Pencil />
                  {t("edit")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-full text-destructive sm:h-10"
                  onClick={() => setDeleting(printer)}
                >
                  <Trash2 />
                  {t("delete")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <PrinterFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        token={token}
        branchId={branchId}
        printer={editing}
        stations={stations}
      />

      <ReceiptPreviewDialog
        token={token}
        branchId={branchId}
        source={preview}
        onClose={() => setPreview(null)}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
          }
        }}
        title={t("deleteConfirm.title", { name: deleting?.name ?? "" })}
        description={t("deleteConfirm.description")}
        impact={t("deleteConfirm.impact")}
        confirmLabel={t("deleteConfirm.confirm")}
        tone="destructive"
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (deleting) {
            deleteMutation.mutate(deleting.id);
          }
        }}
      />
    </SectionCard>
  );
}
