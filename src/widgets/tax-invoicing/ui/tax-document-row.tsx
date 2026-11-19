"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, RotateCw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/shared/api/http-client";
import { taxDocumentsApi } from "@/shared/api/tax-documents-api";
import { formatMoney } from "@/shared/lib/format";
import { ConfirmButton } from "@/shared/ui/confirm-button";
import type { TaxDocument } from "@/shared/types/tax-documents";
import { downloadBlob } from "@/widgets/reports/ui/download-blob";
import { formatReportDateTime } from "@/widgets/reports/ui/report-range";

type TaxDocumentRowProps = {
  doc: TaxDocument;
  token: string | null;
  canRetry: boolean;
};

const KNOWN_ERRORS = [
  "TAX_DOCUMENT_NOT_RETRYABLE",
  "TAX_DOCUMENT_STATE_CHANGED",
  "TAX_DOCUMENT_PDF_NOT_AVAILABLE",
  "TAX_PROVIDER_NOT_ACTIVE",
  "TAX_DOCUMENT_PDF_UNAVAILABLE",
  "TAX_DOCUMENT_NOT_FOUND",
  "TAX_DOCUMENT_NOT_REISSUABLE",
] as const;

const STATUS_VARIANT = {
  PENDING: "secondary",
  ISSUED: "outline",
  REJECTED: "destructive",
} as const;

export function TaxDocumentRow({ doc, token, canRetry }: TaxDocumentRowProps) {
  const t = useTranslations("TaxInvoicing");
  const locale = useLocale();
  const queryClient = useQueryClient();

  const describeError = (error: unknown, fallback: string) => {
    if (!(error instanceof ApiError)) {
      return fallback;
    }

    const raw = JSON.stringify(error.details ?? "");
    const code = KNOWN_ERRORS.find((entry) => raw.includes(entry));

    if (code) {
      return t(`errors.${code}`);
    }

    return error.status === 429 ? t("errors.rateLimited") : fallback;
  };

  const retryMutation = useMutation({
    mutationFn: () => taxDocumentsApi.retry(token!, doc.id),
    onSuccess: () => {
      toast.success(t("retrySuccess"));
      void queryClient.invalidateQueries({ queryKey: ["tax-documents"] });
    },
    onError: (error) => {
      toast.error(describeError(error, t("retryError")));
    },
  });

  const reissueMutation = useMutation({
    mutationFn: () => taxDocumentsApi.reissue(token!, doc.id),
    onSuccess: () => {
      toast.success(t("reissueSuccess"));
      void queryClient.invalidateQueries({ queryKey: ["tax-documents"] });
    },
    onError: (error) => {
      toast.error(describeError(error, t("reissueError")));
    },
  });

  const pdfMutation = useMutation({
    mutationFn: async () => {
      const popup = window.open("", "_blank");

      try {
        const blob = await taxDocumentsApi.fetchPdf(token!, doc.id);

        if (popup) {
          const url = URL.createObjectURL(blob);
          popup.location.href = url;
          setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } else {
          downloadBlob(blob, `${doc.type}-${doc.folio ?? doc.id}.pdf`);
        }
      } catch (error) {
        popup?.close();
        throw error;
      }
    },
    onError: (error) => {
      toast.error(describeError(error, t("pdfError")));
    },
  });

  const canReissue =
    canRetry && doc.status === "REJECTED" && doc.type === "BOLETA_AFECTA";
  const typeLabel = t.has(`types.${doc.type}`) ? t(`types.${doc.type}`) : doc.type;
  const statusLabel =
    doc.status === "PENDING" && doc.needsManualRetry
      ? t("status.NEEDS_RETRY")
      : t(`status.${doc.status}`);

  return (
    <li className="space-y-2 px-4 py-3 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{typeLabel}</p>
            <Badge
              variant={
                doc.needsManualRetry ? "destructive" : STATUS_VARIANT[doc.status]
              }
            >
              {statusLabel}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {[
              doc.folio ? t("folio", { folio: doc.folio }) : null,
              formatReportDateTime(doc.issuedAt ?? doc.createdAt, locale),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <p className="shrink-0 font-semibold tabular-nums">
          {formatMoney(doc.totalAmount)}
        </p>
      </div>

      {doc.lastError && doc.status !== "ISSUED" ? (
        <p
          role="alert"
          className="rounded-xl border border-destructive/25 bg-destructive/8 px-3 py-2 text-xs break-words text-destructive"
        >
          {doc.lastError}
        </p>
      ) : null}

      {doc.hasPdf || canReissue || (canRetry && doc.canRetry) ? (
        <div className="flex flex-wrap gap-2">
          {doc.hasPdf ? (
            <Button
              size="sm"
              variant="outline"
              className="h-11 rounded-full sm:h-10"
              disabled={pdfMutation.isPending}
              onClick={() => pdfMutation.mutate()}
            >
              {pdfMutation.isPending ? <Spinner /> : <FileText />}
              {doc.type === "NOTA_CREDITO" ? t("viewCreditNote") : t("viewReceipt")}
            </Button>
          ) : null}
          {canRetry && doc.canRetry ? (
            <Button
              size="sm"
              variant="outline"
              className="h-11 rounded-full sm:h-10"
              disabled={retryMutation.isPending}
              onClick={() => retryMutation.mutate()}
            >
              {retryMutation.isPending ? <Spinner /> : <RotateCw />}
              {t("retry")}
            </Button>
          ) : null}
          {canReissue ? (
            <ConfirmButton
              size="sm"
              variant="outline"
              className="h-11 rounded-full sm:h-10"
              confirmLabel={t("reissueConfirm")}
              disabled={reissueMutation.isPending}
              onConfirm={() => reissueMutation.mutate()}
            >
              {reissueMutation.isPending ? <Spinner /> : <RotateCw />}
              {t("reissue")}
            </ConfirmButton>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
