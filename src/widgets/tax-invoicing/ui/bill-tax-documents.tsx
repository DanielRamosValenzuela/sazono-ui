"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { taxDocumentsApi } from "@/shared/api/tax-documents-api";
import { TaxDocumentRow } from "./tax-document-row";

type BillTaxDocumentsProps = {
  token: string | null;
  branchId: string;
  billId: string;
  canRetry: boolean;
  onlyRefundId?: string;
};

export function BillTaxDocuments({
  token,
  branchId,
  billId,
  canRetry,
  onlyRefundId,
}: BillTaxDocumentsProps) {
  const t = useTranslations("TaxInvoicing");
  const query = useQuery({
    queryKey: ["tax-documents", "bill", branchId, billId],
    enabled: Boolean(token),
    staleTime: 15_000,
    retry: false,
    refetchInterval: (q) =>
      q.state.data?.some((doc) => doc.status === "PENDING") ? 5_000 : false,
    queryFn: () => taxDocumentsApi.listForBill(token!, branchId, billId),
  });
  const docs = (query.data ?? []).filter((doc) =>
    onlyRefundId === undefined
      ? doc.refundId === null
      : doc.refundId === onlyRefundId
  );

  if (docs.length === 0) {
    return null;
  }

  const list = (
    <ul className="divide-y divide-border/60 rounded-2xl border border-border/70">
      {docs.map((doc) => (
        <TaxDocumentRow key={doc.id} doc={doc} token={token} canRetry={canRetry} />
      ))}
    </ul>
  );

  return onlyRefundId === undefined ? (
    <section aria-label={t("billSection")} className="space-y-3">
      {list}
    </section>
  ) : (
    list
  );
}
