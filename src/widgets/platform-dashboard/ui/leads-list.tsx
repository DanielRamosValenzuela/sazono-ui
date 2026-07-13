"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { leadsApi } from "@/shared/api/leads-api";
import type { Lead, LeadIntent, LeadStatus } from "@/shared/types/leads";
import { useAdminSession } from "@/features/admin-session/model/use-admin-session";

const STATUS_BADGE_CLASS: Record<LeadStatus, string> = {
  NEW: "border-transparent bg-secondary text-secondary-foreground",
  CONTACTED: "border-transparent bg-accent text-accent-foreground",
  CLOSED: "text-muted-foreground",
};

export function LeadsList() {
  const t = useTranslations("AdminLeads");
  const locale = useLocale();
  const session = useAdminSession();

  const leadsQuery = useQuery({
    queryKey: ["admin", "leads", session.accessToken],
    enabled: session.isClientReady && Boolean(session.accessToken),
    retry: false,
    queryFn: () => leadsApi.list(session.accessToken!),
  });

  if (leadsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  if (leadsQuery.isError) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-3xl border border-border/70 bg-card px-6 py-14 text-center shadow-sm">
        <p className="font-medium">{t("loadError")}</p>
      </div>
    );
  }

  const leads = leadsQuery.data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          {t("pageTitle")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {t("pageDescription")}
        </p>
      </div>

      {leads.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/80 px-4 py-10 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-border/70 bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/70 text-left text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase">
                <th className="px-4 py-3">{t("columnName")}</th>
                <th className="px-4 py-3">{t("columnEmail")}</th>
                <th className="px-4 py-3">{t("columnBusiness")}</th>
                <th className="px-4 py-3">{t("columnIntent")}</th>
                <th className="px-4 py-3">{t("columnDate")}</th>
                <th className="px-4 py-3">{t("columnStatus")}</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <LeadRow key={lead.leadId} lead={lead} locale={locale} t={t} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

type LeadRowProps = {
  lead: Lead;
  locale: string;
  t: ReturnType<typeof useTranslations<"AdminLeads">>;
};

const INTENT_LABEL_KEY: Record<LeadIntent, "intentDemo" | "intentInquiry"> = {
  DEMO_REQUEST: "intentDemo",
  GENERAL_INQUIRY: "intentInquiry",
};

const STATUS_LABEL_KEY: Record<
  LeadStatus,
  "statusNew" | "statusContacted" | "statusClosed"
> = {
  NEW: "statusNew",
  CONTACTED: "statusContacted",
  CLOSED: "statusClosed",
};

function LeadRow({ lead, locale, t }: LeadRowProps) {
  const createdAt = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(lead.createdAt));

  return (
    <tr className="border-b border-border/50 last:border-0">
      <td className="px-4 py-3.5 font-medium">{lead.name}</td>
      <td className="px-4 py-3.5 text-muted-foreground">{lead.email}</td>
      <td className="px-4 py-3.5 text-muted-foreground">
        {lead.businessName ?? "—"}
      </td>
      <td className="px-4 py-3.5">
        <Badge variant="outline">{t(INTENT_LABEL_KEY[lead.intent])}</Badge>
      </td>
      <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
        {createdAt}
      </td>
      <td className="px-4 py-3.5">
        <Badge className={STATUS_BADGE_CLASS[lead.status]}>
          {t(STATUS_LABEL_KEY[lead.status])}
        </Badge>
      </td>
    </tr>
  );
}
