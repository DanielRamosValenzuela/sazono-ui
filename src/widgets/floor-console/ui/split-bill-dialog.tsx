"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, SplitSquareHorizontal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { paymentsApi } from "@/shared/api/payments-api";
import { formatMoney } from "@/shared/lib/format";
import type { BillSplitParticipantStatus } from "@/shared/types/billing";
import { FieldGroup, FieldLabel, TextInput } from "@/shared/ui/form-controls";

type SplitBillDialogProps = {
  accessToken: string;
  billId: string;
  remainingAmount: string;
  onClose: () => void;
};

type ParticipantDraft = {
  key: string;
  displayName: string;
  amount: string;
};

function makeEqualParticipants(total: number, count: number): ParticipantDraft[] {
  const base = Math.floor(total / count);
  const remainder = total - base * count;

  return Array.from({ length: count }, (_, index) => ({
    key: `${Date.now()}-${index}`,
    displayName: "",
    amount: String(base + (index === count - 1 ? remainder : 0)),
  }));
}

const PARTICIPANT_STATUS_VARIANT: Record<BillSplitParticipantStatus, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "outline",
  PARTIALLY_PAID: "secondary",
  PAID: "default",
  FAILED: "destructive",
  CANCELLED: "destructive",
};

export function SplitBillDialog({
  accessToken,
  billId,
  remainingAmount,
  onClose,
}: SplitBillDialogProps) {
  const t = useTranslations("FloorConsole");
  const tStatus = useTranslations("Shared.billSplitParticipantStatus");
  const locale = useLocale();
  const queryClient = useQueryClient();

  const currentSplitQuery = useQuery({
    queryKey: ["payments", "bill-split", accessToken, billId],
    queryFn: () => paymentsApi.getCurrentBillSplit(accessToken, billId),
  });

  const [peopleCount, setPeopleCount] = useState(2);
  const [participants, setParticipants] = useState<ParticipantDraft[]>(() =>
    makeEqualParticipants(Math.round(Number(remainingAmount)), 2)
  );

  const remainingAmountNumber = Math.round(Number(remainingAmount));
  const assignedAmount = participants.reduce(
    (total, participant) => total + Math.round(Number(participant.amount) || 0),
    0
  );
  const unassignedAmount = remainingAmountNumber - assignedAmount;
  const canSubmit =
    unassignedAmount === 0 && participants.every((p) => Number(p.amount) > 0);

  const createSplitMutation = useMutation({
    mutationFn: () =>
      paymentsApi.createBillSplit(accessToken, billId, {
        participants: participants.map((p) => ({
          amount: p.amount,
          ...(p.displayName.trim() ? { displayName: p.displayName.trim() } : {}),
        })),
      }),
    onSuccess: () => {
      toast.success(t("splitCreateSuccess"));
      void queryClient.invalidateQueries({ queryKey: ["payments", "bill-split"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("splitCreateError"));
    },
  });

  const copyParticipantLink = async (participantToken: string) => {
    if (typeof window === "undefined") {
      return;
    }

    const url = `${window.location.origin}/${locale}/split?token=${encodeURIComponent(participantToken)}`;
    await navigator.clipboard.writeText(url);
    toast.success(t("splitLinkCopied"));
  };

  const activeSplit = currentSplitQuery.data;
  const isLoading = currentSplitQuery.isPending;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg gap-5">
        <DialogHeader>
          <DialogTitle>{t("splitTitle")}</DialogTitle>
          <DialogDescription>{t("splitDescription")}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : activeSplit ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t("splitActiveHint")}</p>
            <ul className="space-y-2">
              {activeSplit.participants.map((participant, index) => (
                <li
                  key={participant.participantId}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/60 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {participant.displayName || t("splitParticipantFallback", { index: index + 1 })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatMoney(participant.allocatedAmount, "CLP")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={PARTICIPANT_STATUS_VARIANT[participant.status]}>
                      {tStatus(participant.status)}
                    </Badge>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="outline"
                      className="rounded-full"
                      aria-label={t("splitCopyLink")}
                      onClick={() => copyParticipantLink(participant.participantToken)}
                    >
                      <Copy className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="space-y-4">
            <FieldGroup>
              <FieldLabel htmlFor="split-people-count">{t("splitPeopleLabel")}</FieldLabel>
              <div className="flex gap-2">
                <TextInput
                  id="split-people-count"
                  type="number"
                  min={2}
                  max={20}
                  value={peopleCount}
                  onChange={(event) => setPeopleCount(Number(event.target.value) || 2)}
                  className="w-24"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() =>
                    setParticipants(
                      makeEqualParticipants(remainingAmountNumber, Math.max(2, peopleCount))
                    )
                  }
                >
                  <SplitSquareHorizontal className="size-4" />
                  {t("splitEven")}
                </Button>
              </div>
            </FieldGroup>

            <div className="space-y-2">
              {participants.map((participant, index) => (
                <div key={participant.key} className="flex items-center gap-2">
                  <TextInput
                    placeholder={t("splitParticipantFallback", { index: index + 1 })}
                    value={participant.displayName}
                    onChange={(event) =>
                      setParticipants((prev) =>
                        prev.map((p) =>
                          p.key === participant.key
                            ? { ...p, displayName: event.target.value }
                            : p
                        )
                      )
                    }
                    className="flex-1"
                  />
                  <TextInput
                    type="number"
                    min={0}
                    value={participant.amount}
                    onChange={(event) =>
                      setParticipants((prev) =>
                        prev.map((p) =>
                          p.key === participant.key
                            ? { ...p, amount: event.target.value }
                            : p
                        )
                      )
                    }
                    className="w-32"
                  />
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="rounded-full text-destructive"
                    disabled={participants.length <= 2}
                    onClick={() =>
                      setParticipants((prev) => prev.filter((p) => p.key !== participant.key))
                    }
                  >
                    ×
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full"
                onClick={() =>
                  setParticipants((prev) => [
                    ...prev,
                    { key: `${Date.now()}`, displayName: "", amount: "0" },
                  ])
                }
              >
                {t("splitAddParticipant")}
              </Button>
            </div>

            <div
              className={
                unassignedAmount === 0
                  ? "rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary"
                  : "rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
              }
            >
              {unassignedAmount === 0
                ? t("splitBalanced")
                : t("splitUnbalanced", { amount: formatMoney(unassignedAmount, "CLP") })}
            </div>

            <Button
              type="button"
              size="lg"
              className="w-full rounded-full"
              disabled={!canSubmit || createSplitMutation.isPending}
              onClick={() => createSplitMutation.mutate()}
            >
              {createSplitMutation.isPending ? <Spinner /> : null}
              {createSplitMutation.isPending ? t("splitSubmitting") : t("splitSubmit")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
