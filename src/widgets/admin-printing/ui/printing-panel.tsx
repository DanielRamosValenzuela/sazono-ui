"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAdminSession } from "@/features/admin-session/model/use-admin-session";
import { cn } from "@/lib/utils";
import {
  getBranchAccessList,
  hasBranchPermission,
} from "@/shared/lib/branch-access";
import { SelectInput } from "@/shared/ui/form-controls";
import { DevicesTab } from "./devices-tab";
import { JobsTab } from "./jobs-tab";
import { PrintersTab } from "./printers-tab";
import { StationsTab } from "./stations-tab";

const TABS = ["printers", "stations", "jobs", "devices"] as const;
type Tab = (typeof TABS)[number];

export function PrintingPanel() {
  const t = useTranslations("AdminPrinting");
  const session = useAdminSession();
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("printers");
  const branches =
    session.user?.profileType === "staff"
      ? getBranchAccessList(session.user).filter((branch) =>
          hasBranchPermission(branch, ["ADMIN"]),
        )
      : [];
  const branch =
    branches.find((entry) => entry.branchId === selected) ?? branches[0];
  const token = session.accessToken;

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
              <label htmlFor="printing-branch" className="sr-only">
                {t("branch")}
              </label>
              <SelectInput
                id="printing-branch"
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

          <div
            role="tablist"
            aria-label={t("pageTitle")}
            className="grid grid-cols-2 gap-2 sm:grid-cols-4"
          >
            {TABS.map((entry) => (
              <button
                key={entry}
                type="button"
                role="tab"
                id={`printing-tab-${entry}`}
                aria-selected={tab === entry}
                aria-controls="printing-tabpanel"
                onClick={() => setTab(entry)}
                tabIndex={tab === entry ? 0 : -1}
                onKeyDown={(event) => {
                  const step =
                    event.key === "ArrowRight"
                      ? 1
                      : event.key === "ArrowLeft"
                        ? -1
                        : 0;

                  if (step === 0) {
                    return;
                  }
                  event.preventDefault();
                  const next =
                    TABS[
                      (TABS.indexOf(entry) + step + TABS.length) % TABS.length
                    ];

                  setTab(next);
                  document.getElementById(`printing-tab-${next}`)?.focus();
                }}
                className={cn(
                  "h-11 cursor-pointer rounded-full border px-3 text-sm font-medium transition-colors",
                  tab === entry
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-muted",
                )}
              >
                {t(`tabs.${entry}`)}
              </button>
            ))}
          </div>

          <div
            role="tabpanel"
            id="printing-tabpanel"
            aria-labelledby={`printing-tab-${tab}`}
            key={`${tab}-${branch.branchId}`}
          >
            {tab === "printers" ? (
              <PrintersTab token={token} branchId={branch.branchId} />
            ) : tab === "stations" ? (
              <StationsTab token={token} branchId={branch.branchId} />
            ) : tab === "jobs" ? (
              <JobsTab token={token} branchId={branch.branchId} />
            ) : (
              <DevicesTab token={token} branchId={branch.branchId} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
