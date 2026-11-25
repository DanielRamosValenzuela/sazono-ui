"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ApiError } from "@/shared/api/http-client";
import { printingApi } from "@/shared/api/printing-api";
import type { StationTicket, TicketPrintStatus } from "@/shared/types/kitchen";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";

const STATUS_COLOR: Record<TicketPrintStatus, string> = {
  PRINTED: "text-emerald-600 dark:text-emerald-400",
  PENDING: "text-amber-600 dark:text-amber-400",
  FAILED: "text-destructive",
  NONE: "text-muted-foreground",
};

export function TicketPrintIcon({ ticket }: { ticket: StationTicket }) {
  const t = useTranslations("KitchenBoard");

  if (!ticket.print) {
    return null;
  }

  const label = t(`print.${ticket.print.status}`);

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn("inline-flex", STATUS_COLOR[ticket.print.status])}
    >
      <Printer className="size-4" aria-hidden="true" />
    </span>
  );
}

type TicketReprintButtonProps = {
  ticket: StationTicket;
  token: string | null;
  branchId: string;
  disabled?: boolean;
};

export function TicketReprintButton({
  ticket,
  token,
  branchId,
  disabled,
}: TicketReprintButtonProps) {
  const t = useTranslations("KitchenBoard");
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const mutation = useMutation({
    mutationFn: () =>
      printingApi.reprintTicket(token!, branchId, ticket.stationTicketId),
    onSuccess: () => {
      toast.success(t("reprintQueued"));
      void queryClient.invalidateQueries({ queryKey: ["kitchen", "tickets"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError && error.status === 404
          ? t("reprintNoJobs")
          : t("reprintError")
      );
    },
  });

  if (!ticket.print || ticket.print.status === "NONE") {
    return null;
  }

  const run = () => {
    if (ticket.print?.status === "PRINTED") {
      setConfirmOpen(true);
    } else {
      mutation.mutate();
    }
  };

  return (
    <>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="size-11 rounded-full text-muted-foreground sm:size-8"
        aria-label={t("reprint")}
        title={t("reprint")}
        disabled={disabled || mutation.isPending || !token}
        onClick={run}
      >
        <Printer className="size-4" />
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("reprintConfirm.title")}
        description={t("reprintConfirm.description")}
        impact={t("reprintConfirm.impact")}
        confirmLabel={t("reprintConfirm.confirm")}
        tone="warning"
        isPending={mutation.isPending}
        onConfirm={async () => {
          await mutation.mutateAsync().catch(() => undefined);
          setConfirmOpen(false);
        }}
      />
    </>
  );
}
