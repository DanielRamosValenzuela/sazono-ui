"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { DoorOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { floorApi } from "@/shared/api/floor-api";
import type {
  FloorTable,
  TableSessionDetail,
  TableSessionSource,
} from "@/shared/types/floor";
import { FieldGroup, FieldLabel, NumberStepper } from "@/shared/ui/form-controls";

type OpenTableDialogProps = {
  accessToken: string;
  branchId: string;
  table: FloorTable;
  openedBySource: TableSessionSource;
  showZoneWarning: boolean;
  onOpened: (session: TableSessionDetail) => void;
  onClose: () => void;
};

export function OpenTableDialog({
  accessToken,
  table,
  openedBySource,
  showZoneWarning,
  onOpened,
  onClose,
}: OpenTableDialogProps) {
  const t = useTranslations("FloorConsole");
  const [guestCount, setGuestCount] = useState(table.capacity > 0 ? table.capacity : 1);

  const openTableMutation = useMutation({
    mutationFn: () =>
      floorApi.openTableSession(accessToken, {
        tableId: table.tableId,
        openedBySource,
        guestCount,
      }),
    onSuccess: (openedSession) => {
      onOpened(openedSession);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("openError"));
    },
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("openAction")}</DialogTitle>
          <DialogDescription>{t("openDialogDescription")}</DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <FieldLabel>{t("guestCountLabel")}</FieldLabel>
          <NumberStepper
            value={guestCount}
            onChange={setGuestCount}
            min={1}
            max={30}
          />
        </FieldGroup>

        {showZoneWarning ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
            {t("openZoneWarning")}
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="ghost" className="rounded-full" onClick={onClose}>
            {t("addOrderCancel")}
          </Button>
          <Button
            type="button"
            className="rounded-full"
            disabled={openTableMutation.isPending}
            onClick={() => openTableMutation.mutate()}
          >
            {openTableMutation.isPending ? <Spinner /> : <DoorOpen className="size-4" />}
            {openTableMutation.isPending ? t("openSubmitting") : t("openAction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
