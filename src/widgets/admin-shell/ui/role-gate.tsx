"use client";

import type { PropsWithChildren } from "react";
import { ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAdminSession } from "@/features/admin-session/model/use-admin-session";

type RoleGateProps = PropsWithChildren<{
  allow: "platform" | "restaurantAdmin";
}>;

/** Muestra el contenido solo si la sesión tiene el perfil requerido. */
export function RoleGate({ allow, children }: RoleGateProps) {
  const t = useTranslations("AdminShell");
  const session = useAdminSession();

  if (!session.isClientReady || !session.user) {
    return null;
  }

  const isAllowed =
    allow === "platform" ? session.isPlatformAdmin : session.isRestaurantAdmin;

  if (!isAllowed) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-border/70 bg-card px-6 py-14 text-center shadow-sm">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="size-6" />
        </span>
        <div>
          <h1 className="text-xl font-semibold">{t("accessDeniedTitle")}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {t("accessDeniedDescription")}
          </p>
        </div>
        <Link
          href="/admin"
          className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-border bg-card px-5 text-sm font-medium transition-colors hover:bg-muted"
        >
          {t("backToOverview")}
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
