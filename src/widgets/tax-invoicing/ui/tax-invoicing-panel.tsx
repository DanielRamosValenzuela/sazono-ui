"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { getBranchAccessList, hasBranchPermission } from "@/shared/lib/branch-access";
import { SelectInput } from "@/shared/ui/form-controls";
import { useAdminSession } from "@/features/admin-session/model/use-admin-session";
import { TaxDocumentsList } from "./tax-documents-list";
import { TaxProviderCard } from "./tax-provider-card";

export function TaxInvoicingPanel() {
  const t = useTranslations("TaxInvoicing");
  const session = useAdminSession();
  const [selected, setSelected] = useState<string | null>(null);
  const branches =
    session.user?.profileType === "staff"
      ? getBranchAccessList(session.user).filter((branch) =>
          hasBranchPermission(branch, ["ADMIN"])
        )
      : [];
  const branch = branches.find((entry) => entry.branchId === selected) ?? branches[0];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          {t("pageTitle")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {t("pageDescription")}
        </p>
      </header>

      {!branch ? (
        <p className="text-sm text-muted-foreground">{t("noBranch")}</p>
      ) : (
        <>
          {branches.length > 1 ? (
            <div className="w-full sm:w-64">
              <label htmlFor="tax-branch" className="sr-only">
                {t("branch")}
              </label>
              <SelectInput
                id="tax-branch"
                value={branch.branchId}
                onChange={(event) => setSelected(event.target.value)}
              >
                {branches.map((entry) => (
                  <option key={entry.branchId} value={entry.branchId}>
                    {entry.branchName}
                  </option>
                ))}
              </SelectInput>
            </div>
          ) : null}
          <TaxProviderCard
            key={`provider-${branch.branchId}`}
            token={session.accessToken}
            branchId={branch.branchId}
          />
          <TaxDocumentsList
            key={`docs-${branch.branchId}`}
            token={session.accessToken}
            branchId={branch.branchId}
          />
        </>
      )}
    </div>
  );
}
