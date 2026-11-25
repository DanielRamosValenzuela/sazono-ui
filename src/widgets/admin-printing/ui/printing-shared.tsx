"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ApiError } from "@/shared/api/http-client";
import type {
  PrinterStatus,
  PrintJobStatus,
} from "@/shared/types/printing";

const KNOWN_ERROR_CODES = [
  "PRINTER_HAS_OPEN_JOBS",
  "PRINT_CODE_TAKEN",
  "PRINTER_INACTIVE",
  "PRINT_JOB_NOT_RETRYABLE",
] as const;

export function usePrintingErrorMessage() {
  const t = useTranslations("AdminPrinting");
  const tErr = useTranslations("PrintErrors");

  return (error: unknown, fallback: string) => {
    if (!(error instanceof ApiError)) {
      return fallback;
    }

    const raw = JSON.stringify(error.details ?? "");
    const code = KNOWN_ERROR_CODES.find((entry) => raw.includes(entry));

    if (code) {
      return t(`errors.${code}`);
    }

    if (error.status === 429) {
      return t("errors.rateLimited");
    }

    if (error.status === 409) {
      return t("errors.conflict");
    }

    if (error.message.includes("host TCP no esta permitido")) {
      return tErr("tcpHostNotAllowed");
    }

    if (error.message.includes("puerto TCP")) {
      return tErr("tcpPortRange");
    }

    if (error.status === 400 && error.message) {
      return error.message;
    }

    return fallback;
  };
}

const STATUS_DOT: Record<PrinterStatus, string> = {
  ONLINE: "bg-emerald-500",
  OFFLINE: "bg-destructive",
  ERROR: "bg-destructive",
  UNKNOWN: "bg-muted-foreground/50",
};

export function PrinterStatusLabel({ status }: { status: PrinterStatus }) {
  const t = useTranslations("AdminPrinting");

  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium">
      <span
        aria-hidden="true"
        className={cn("size-2.5 rounded-full", STATUS_DOT[status])}
      />
      {t(`printerStatus.${status}`)}
    </span>
  );
}

const JOB_VARIANT = {
  PENDING: "secondary",
  CLAIMED: "secondary",
  PRINTED: "outline",
  FAILED: "destructive",
  CANCELLED: "outline",
} as const;

export function JobStatusBadge({ status }: { status: PrintJobStatus }) {
  const t = useTranslations("AdminPrinting");

  return <Badge variant={JOB_VARIANT[status]}>{t(`jobStatus.${status}`)}</Badge>;
}

export function CopyButton({ value, label }: { value: string; label: string }) {
  const t = useTranslations("AdminPrinting");
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const field = document.createElement("textarea");

      field.value = value;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();

      const ok = document.execCommand("copy");

      field.remove();
      if (!ok) {
        setCopied(false);
        toast.error(t("copyFailed"));

        return;
      }
    }
    setCopied(true);
    toast.success(t("codeCopied"));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="h-11 rounded-full"
      aria-label={label}
      onClick={copy}
    >
      {copied ? <Check /> : <Copy />}
      {copied ? t("copied") : label}
    </Button>
  );
}

export function SectionCard({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-3xl border border-border/70 bg-card p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">{title}</h2>
          {description ? (
            <p className="text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
