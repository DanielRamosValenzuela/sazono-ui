"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { taxDocumentsApi } from "@/shared/api/tax-documents-api";
import type { TaxDocumentStatus } from "@/shared/types/tax-documents";
import { SelectInput } from "@/shared/ui/form-controls";
import { TaxDocumentRow } from "./tax-document-row";

type TaxDocumentsListProps = {
  token: string | null;
  branchId: string;
};

export function TaxDocumentsList({ token, branchId }: TaxDocumentsListProps) {
  const t = useTranslations("TaxInvoicing");
  const [status, setStatus] = useState<TaxDocumentStatus | "">("");
  const query = useQuery({
    queryKey: ["tax-documents", "list", branchId, status],
    enabled: Boolean(token),
    refetchInterval: 30_000,
    queryFn: () =>
      taxDocumentsApi.list(token!, branchId, {
        status: status || undefined,
      }),
  });

  return (
    <section className="space-y-3 rounded-3xl border border-border/70 bg-card p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("listTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("listDescription")}</p>
        </div>
        <div className="w-full sm:w-48">
          <label htmlFor="tax-doc-status" className="sr-only">
            {t("filterStatus")}
          </label>
          <SelectInput
            id="tax-doc-status"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as TaxDocumentStatus | "")
            }
          >
            <option value="">{t("allStatuses")}</option>
            <option value="PENDING">{t("status.PENDING")}</option>
            <option value="ISSUED">{t("status.ISSUED")}</option>
            <option value="REJECTED">{t("status.REJECTED")}</option>
          </SelectInput>
        </div>
      </div>

      {query.isLoading ? (
        <Skeleton className="h-32 w-full rounded-2xl" />
      ) : query.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {t("listError")}
        </p>
      ) : (query.data ?? []).length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {t("listEmpty")}
        </p>
      ) : (
        <ul className="divide-y divide-border/60 rounded-2xl border border-border/70">
          {query.data!.map((doc) => (
            <TaxDocumentRow key={doc.id} doc={doc} token={token} canRetry />
          ))}
        </ul>
      )}
    </section>
  );
}
