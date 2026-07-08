"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
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
import { FieldGroup, FieldLabel, TextArea } from "@/shared/ui/form-controls";

type AbandonSessionDialogProps = {
  accessToken: string;
  tableSessionId: string;
  onClose: () => void;
};

export function AbandonSessionDialog({
  accessToken,
  tableSessionId,
  onClose,
}: AbandonSessionDialogProps) {
  const t = useTranslations("FloorConsole");
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");

  const abandonMutation = useMutation({
    mutationFn: () =>
      floorApi.abandonTableSession(accessToken, tableSessionId, {
        closeReason: reason.trim(),
      }),
    onSuccess: () => {
      toast.success(t("abandonSuccess"));
      void queryClient.invalidateQueries({ queryKey: ["floor", "tables"] });
      void queryClient.invalidateQueries({ queryKey: ["floor", "current-session"] });
      void queryClient.invalidateQueries({ queryKey: ["billing", "current-bill"] });
      onClose();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("abandonError"));
    },
  });

  const canSubmit = reason.trim().length > 0;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <DialogTitle>{t("abandonTitle")}</DialogTitle>
              <DialogDescription>{t("abandonDescription")}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <FieldGroup>
          <FieldLabel htmlFor="abandon-reason">{t("abandonReasonLabel")}</FieldLabel>
          <TextArea
            id="abandon-reason"
            rows={3}
            placeholder={t("abandonReasonPlaceholder")}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </FieldGroup>

        <DialogFooter>
          <Button type="button" variant="ghost" className="rounded-full" onClick={onClose}>
            {t("addOrderCancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="rounded-full"
            disabled={!canSubmit || abandonMutation.isPending}
            onClick={() => abandonMutation.mutate()}
          >
            {abandonMutation.isPending ? <Spinner /> : null}
            {abandonMutation.isPending ? t("abandonSubmitting") : t("abandonSubmit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
