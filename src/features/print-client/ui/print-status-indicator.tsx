"use client";

import { Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { usePrintErrorText } from "@/shared/lib/print-error";
import { usePrintClientStore } from "../model/print-client.store";

export function PrintStatusIndicator() {
  const t = useTranslations("PrintClient");
  const describePrintError = usePrintErrorText();
  const hydrated = usePrintClientStore((state) => state.hydrated);
  const paired = usePrintClientStore((state) => Boolean(state.credentials));
  const status = usePrintClientStore((state) => state.status);
  const lastJob = usePrintClientStore((state) => state.lastJob);
  const queue = usePrintClientStore((state) => state.queue);
  const previewMode = usePrintClientStore((state) => state.previewMode);

  if (!hydrated) {
    return null;
  }

  const failing =
    paired &&
    (status === "error" ||
      status === "offline" ||
      (lastJob !== null && !lastJob.ok));
  const preview = paired && !failing && previewMode;
  const active = paired && !failing && !preview && status === "connected";
  const label = !paired
    ? t("indicatorSetup")
    : preview
      ? t("indicatorPreview")
      : failing
        ? t("indicatorError", {
            detail:
              lastJob && !lastJob.ok
                ? lastJob.error
                  ? describePrintError(lastJob.error)
                  : t("statusError")
                : t(`status.${status}`),
          })
        : t("indicatorOn", { status: t(`status.${status}`) });

  return (
    <Link
      href="/staff/printing"
      title={label}
      aria-label={label}
      className={cn(
        "relative inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-foreground transition-colors hover:bg-muted",
        !paired && "text-muted-foreground",
        failing && "border-destructive/40 text-destructive",
        preview && "border-amber-500/60 text-amber-700 dark:text-amber-400",
      )}
    >
      <Printer className="size-5" />
      {paired ? (
        <>
          <span
            aria-hidden
            className={cn(
              "size-2.5 rounded-full",
              failing
                ? "bg-destructive"
                : active
                  ? "bg-emerald-500"
                  : "bg-amber-500",
            )}
          />
          {queue > 0 ? (
            <span className="text-xs font-semibold tabular-nums">{queue}</span>
          ) : null}
        </>
      ) : null}
    </Link>
  );
}
