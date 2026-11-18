"use client";

import { useQuery } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAdminSession } from "@/features/admin-session/model/use-admin-session";
import { Link } from "@/i18n/navigation";
import { cashApi } from "@/shared/api/cash-api";
import {
  getBranchAccessList,
  hasBranchPermission,
} from "@/shared/lib/branch-access";
import { formatMoney } from "@/shared/lib/format";

export function CashStatusCard() {
  const t = useTranslations("CashRegister");
  const session = useAdminSession();
  const token = session.accessToken;
  const branch = (session.user ? getBranchAccessList(session.user) : []).find(
    (item) => hasBranchPermission(item, ["ADMIN", "SUPERVISOR", "CASHIER"]),
  );
  const query = useQuery({
    queryKey: ["cash", "current", branch?.branchId],
    enabled: session.isClientReady && Boolean(token) && Boolean(branch),
    refetchInterval: 30_000,
    queryFn: () => cashApi.current(token!, branch!.branchId),
  });

  if (!branch) {
    return null;
  }

  const current = query.data?.session ?? null;

  return (
    <Link
      href="/staff/caja"
      className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 shadow-sm transition-colors hover:bg-muted"
    >
      <span className="flex items-center gap-3">
        <Wallet className="size-5 text-primary" />
        <span>
          <span className="block text-sm font-semibold">{t("cardTitle")}</span>
          <span className="block text-xs text-muted-foreground">
            {current
              ? t("cardOpen", { label: current.registerLabel })
              : t("cardClosed")}
          </span>
        </span>
      </span>
      {current ? (
        <span className="text-right">
          <span className="block text-xs text-muted-foreground">
            {t("expectedSoFar")}
          </span>
          <span className="block text-sm font-semibold">
            {formatMoney(current.expectedCash)}
          </span>
        </span>
      ) : null}
    </Link>
  );
}
